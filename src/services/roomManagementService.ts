
import { supabase } from "@/lib/supabase";
import { AuthUser } from "@/lib/auth";
import { GameRoom, Player, GameMode, Difficulty, TargetImage } from "@/types/game";
import { toast } from "sonner";
import { generateRoomCode } from "./roomCodeGenerator";
import { getRandomTargetImage } from "./targetImageService";

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
    
    // Map player profiles correctly - fix the TypeScript error
    const mappedPlayers: Player[] = playersWithProfiles.map((playerData: any) => ({
      id: playerData.profiles.id,
      username: playerData.profiles.username || 'Player',
      avatar_url: playerData.profiles.avatar_url
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
