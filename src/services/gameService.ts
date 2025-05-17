import { supabase } from "@/lib/supabase";
import { AuthUser } from "@/lib/auth";
import { GameRoom, Player, GameMode, Difficulty } from "@/types/game";
import { toast } from "sonner";

// Helper function to generate random code
export const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Get random target image from the database
export const getRandomTargetImage = async (difficulty: Difficulty): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('target_images')
      .select('url')
      .eq('difficulty', difficulty)
      .order('RANDOM()')
      .limit(1)
      .single();
    
    if (error) throw error;
    return data.url;
  } catch (error) {
    console.error('Error fetching target image:', error);
    // Fallback to placeholder
    return '/placeholder.svg';
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
    const targetImageUrl = await getRandomTargetImage(difficulty);
    
    // Insert room into database
    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        name,
        game_mode: gameMode,
        difficulty,
        owner_id: owner.id,
        join_code: joinCode,
        target_image_url: targetImageUrl,
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
    
    const player = {  // Create a player object from the data
      id: data.id,
      username: data.username,
      avatar_url: data.avatar_url
    };
    
    const room: GameRoom = {
      ...data,
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
    // Find room by join code
    const { data: roomData, error: roomError } = await supabase
      .from('game_rooms')
      .select()
      .eq('join_code', joinCode)
      .single();
    
    if (roomError) throw roomError;
    
    // Check if room is full
    const { data: playersData, error: countError } = await supabase
      .from('game_players')
      .select('user_id', { count: 'exact' })
      .eq('room_id', roomData.id);
    
    if (countError) throw countError;
    
    if (playersData.length >= roomData.max_players) {
      toast.error('Room is full');
      return null;
    }
    
    // Check if user is already in the room
    const alreadyJoined = playersData.some(p => p.user_id === user.id);
    
    if (!alreadyJoined) {
      // Add user as player
      const { error: joinError } = await supabase
        .from('game_players')
        .insert({
          room_id: roomData.id,
          user_id: user.id
        });
      
      if (joinError) throw joinError;
    }
    
    // Get all players in the room
    const { data: players, error: playersError } = await supabase
      .from('game_players')
      .select(`
        user_id,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('room_id', roomData.id);
    
    if (playersError) throw playersError;
    const mappedPlayers: Player[] = players.map(p => ({
      id: p.profiles[0].id,
      username: p.profiles[0].username,
      avatar_url: p.profiles[0].avatar_url
    }));
    const room: GameRoom = {
      ...roomData,
      players: mappedPlayers
    };
    
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
