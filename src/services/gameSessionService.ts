
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
