
import { supabase } from "@/lib/supabase";
import { AuthUser } from "@/lib/auth";
import { GameRoom, Player, GameMode, Difficulty, TargetImage } from "@/types/game";
import { toast } from "sonner";

// Helper function to generate random code
export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get random target image from the database
export const getRandomTargetImage = async (difficulty: Difficulty): Promise<TargetImage | null> => {
  try {
    console.log(`Fetching random target image with difficulty: ${difficulty}`);
    
    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('target_images')
        .select('*')
        .eq('difficulty', difficulty);
      if (error) throw error;
      return data;
    };

    let data = await fetchImages();

    if (!data || data.length === 0) {
      console.log('No target images found, initializing database...');
      await initializeTargetImages();
      data = await fetchImages();
    }

    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      console.log('Fetched target image:', data[randomIndex]);
      return data[randomIndex] as TargetImage;
    }

    return null;
  } catch (error) {
    console.error('Error fetching target image:', error);
    toast.error('Failed to fetch target image');
    return null;
  }
};

// Create a new game room
export const createGameRoom = async (
  name: string, 
  gameMode: GameMode, 
  difficulty: Difficulty, 
  owner: AuthUser,
  maxPlayers: number = 8
): Promise<GameRoom | null> => {
  try {
    const joinCode = generateRoomCode();
    const targetImage = await getRandomTargetImage(difficulty);
    
    if (!targetImage) {
      toast.error('Failed to fetch a target image');
      return null;
    }
    
    console.log('Using target image for new room:', targetImage);
    
    // Insert room into database
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        name,
        game_mode: gameMode,
        difficulty,
        owner_id: owner.id,
        join_code: joinCode,
        target_image_url: targetImage.url,
        max_players: maxPlayers
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Add owner as the first player
    const { error: playerError } = await supabase
      .from('game_players')
      .insert({
        room_id: data.id,
        user_id: owner.id
      });
    
    if (playerError) throw playerError;
    
    const player: Player = {
      id: owner.id,
      username: owner.username || owner.user_metadata?.username || 'Player',
      avatar_url: owner.avatar_url || owner.user_metadata?.avatar_url
    };
    
    const room: GameRoom = {
      ...data,
      target_image: targetImage,
      players: [player]
    };
    
    return room;
  } catch (error) {
    console.error('Error creating game room:', error);
    toast.error('Failed to create game room');
    return null;
  }
};

// Join a game room
export const joinGameRoom = async (
  joinCode: string, 
  user: AuthUser
): Promise<GameRoom | null> => {
  try {
    console.log('Attempting to join room with code:', joinCode, 'User:', user.id);
    
    // Find room by join code
    const { data: roomData, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .eq('status', 'waiting') // Only allow joining waiting rooms
      .single();
    
    if (roomError) {
      console.error('Room lookup error:', roomError);
      if (roomError.code === 'PGRST116') {
        toast.error('Room not found or no longer available');
      } else {
        toast.error('Failed to find room');
      }
      return null;
    }
    
    console.log('Found room:', roomData);
    
    // Check current player count
    const { data: playersData, error: countError } = await supabase
      .from('game_players')
      .select('user_id')
      .eq('room_id', roomData.id);
    
    if (countError) {
      console.error('Error counting players:', countError);
      toast.error('Failed to check room capacity');
      return null;
    }
    
    console.log('Current players in room:', playersData);
    
    if (playersData.length >= roomData.max_players) {
      toast.error('Room is full');
      return null;
    }
    
    // Check if user is already in the room
    const alreadyJoined = playersData.some(p => p.user_id === user.id);
    console.log('User already in room:', alreadyJoined);
    
    if (!alreadyJoined) {
      // Add user as player
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id
        });
      
      if (joinError) {
        console.error('Error adding player to room:', joinError);
        toast.error('Failed to join room');
        return null;
      }
      
      console.log('Successfully added player to room');
    }
    
    // Get all players in the room with their profiles
    const { data: playersWithProfiles, error: playersError } = await supabase
      .from('game_players')
      .select(`
        user_id,
        profiles!inner(
          id,
          username,
          avatar_url
        )
      `)
      .eq('room_id', roomData.id);
    
    if (playersError) {
      console.error('Error fetching players with profiles:', playersError);
      // Fallback: create player list without profile data
      const fallbackPlayers: Player[] = playersData.map(p => ({
        id: p.user_id,
        username: p.user_id === user.id ? (user.username || 'You') : 'Player',
        avatar_url: p.user_id === user.id ? user.avatar_url : undefined
      }));
      
      console.log('Using fallback player list:', fallbackPlayers);
      
      // Get target image for the room
      let targetImage: TargetImage | null = null;
      if (roomData.target_image_url) {
        const { data: imageData } = await supabase
          .from('target_images')
          .select('*')
          .eq('url', roomData.target_image_url)
          .maybeSingle();
        
        if (imageData) {
          targetImage = imageData as TargetImage;
        }
      }
      
      const room: GameRoom = {
        ...roomData,
        target_image: targetImage,
        players: fallbackPlayers
      };
      
      return room;
    }
    
    // Map player profiles correctly
    const mappedPlayers: Player[] = playersWithProfiles.map(p => ({
      id: p.profiles.id,
      username: p.profiles.username || 'Player',
      avatar_url: p.profiles.avatar_url
    }));
    
    console.log('Mapped players:', mappedPlayers);
    
    // Get target image for the room
    let targetImage: TargetImage | null = null;
    if (roomData.target_image_url) {
      const { data: imageData } = await supabase
        .from('target_images')
        .select('*')
        .eq('url', roomData.target_image_url)
        .maybeSingle();
      
      if (imageData) {
        targetImage = imageData as TargetImage;
      }
    }
    
    const room: GameRoom = {
      ...roomData,
      target_image: targetImage,
      players: mappedPlayers
    };
    
    console.log('Final room object:', room);
    return room;
  } catch (error) {
    console.error('Error joining game room:', error);
    toast.error('Failed to join game room');
    return null;
  }
};

// Leave a game room
export const leaveGameRoom = async (
  roomId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('game_players')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error leaving game room:', error);
    toast.error('Failed to leave game room');
    return false;
  }
};

// Start a game
export const startGameSession = async (
  roomId: string,
  ownerId: string
): Promise<boolean> => {
  try {
    // Update room status to playing
    const { error: roomError } = await supabase
      .from('game_rooms')
      .update({ status: 'playing' })
      .eq('id', roomId)
      .eq('owner_id', ownerId);
    
    if (roomError) throw roomError;
    
    // Create active session
    const { error: sessionError } = await supabase
      .from('active_sessions')
      .insert({
        room_id: roomId
      });
    
    if (sessionError) throw sessionError;
    
    return true;
  } catch (error) {
    console.error('Error starting game session:', error);
    toast.error('Failed to start game');
    return false;
  }
};

// Generate AI image based on prompt
export const generateAIImage = async (prompt: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { prompt }
    });
    
    if (error) throw error;
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating image:', error);
    toast.error('Failed to generate image');
    return null;
  }
};

// Initialize target images in the database
export const initializeTargetImages = async () => {
  try {
    // Check if we already have target images
    const { data: existingImages, error: checkError } = await supabase
      .from('target_images')
      .select('id')
      .limit(1);

    if (checkError) throw checkError;

    // If we already have images, don't add more
    if (existingImages && existingImages.length > 0) {
      console.log('Target images already exist in database');
      return;
    }

    // Sample target images for each difficulty
    const targetImages = [
      {
        name: 'Easy Landscape',
        url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
        difficulty: 'easy',
        category: 'landscape'
      },
      {
        name: 'Easy Portrait',
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
        difficulty: 'easy',
        category: 'portrait'
      },
      {
        name: 'Medium Abstract',
        url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809',
        difficulty: 'medium',
        category: 'abstract'
      },
      {
        name: 'Medium Still Life',
        url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634',
        difficulty: 'medium',
        category: 'still-life'
      },
      {
        name: 'Hard Fantasy',
        url: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce',
        difficulty: 'hard',
        category: 'fantasy'
      },
      {
        name: 'Hard Sci-Fi',
        url: 'https://images.unsplash.com/photo-1520288992255-dfb30894896b',
        difficulty: 'hard',
        category: 'sci-fi'
      }
    ];

    // Insert the target images
    const { error: insertError } = await supabase
      .from('target_images')
      .insert(targetImages);

    if (insertError) throw insertError;

    console.log('Successfully initialized target images');
  } catch (error) {
    console.error('Error initializing target images:', error);
  }
};
