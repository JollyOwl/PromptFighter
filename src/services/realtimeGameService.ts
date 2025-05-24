
import { supabase } from '@/integrations/supabase/client';
import { GamePhase } from '@/types/game';
import { toast } from 'sonner';

export interface GameSubmission {
  id: string;
  room_id: string;
  player_id: string;
  prompt: string;
  image_url: string;
  accuracy_score: number;
  votes_received: number;
  created_at: string;
}

export interface GameVote {
  id: string;
  room_id: string;
  voter_id: string;
  submission_id: string;
  created_at: string;
}

export interface ActiveSession {
  id: string;
  room_id: string;
  current_phase: GamePhase;
  phase_start_time: string;
  phase_duration: number;
  start_time: string;
  last_activity: string;
  updated_at: string;
}

// Submit a game entry (image + prompt)
export const submitGameEntry = async (
  roomId: string,
  playerId: string,
  prompt: string,
  imageUrl: string,
  accuracyScore: number = 0
): Promise<GameSubmission | null> => {
  try {
    const { data, error } = await supabase
      .from('game_submissions')
      .insert({
        room_id: roomId,
        player_id: playerId,
        prompt,
        image_url: imageUrl,
        accuracy_score: accuracyScore
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('Game entry submitted successfully!');
    return data as GameSubmission;
  } catch (error) {
    console.error('Error submitting game entry:', error);
    toast.error('Failed to submit game entry');
    return null;
  }
};

// Get all submissions for a room
export const getRoomSubmissions = async (roomId: string): Promise<GameSubmission[]> => {
  try {
    const { data, error } = await supabase
      .from('game_submissions')
      .select(`
        *,
        profiles:player_id (
          username,
          avatar_url
        )
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as GameSubmission[];
  } catch (error) {
    console.error('Error fetching room submissions:', error);
    return [];
  }
};

// Get current active session for a room
export const getActiveSession = async (roomId: string): Promise<ActiveSession | null> => {
  try {
    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ActiveSession | null;
  } catch (error) {
    console.error('Error fetching active session:', error);
    return null;
  }
};

// Get votes for a room
export const getRoomVotes = async (roomId: string): Promise<GameVote[]> => {
  try {
    const { data, error } = await supabase
      .from('game_votes')
      .select('*')
      .eq('room_id', roomId);

    if (error) throw error;
    return data as GameVote[];
  } catch (error) {
    console.error('Error fetching room votes:', error);
    return [];
  }
};

// Check if user has already voted in a room
export const hasUserVoted = async (roomId: string, userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('game_votes')
      .select('id')
      .eq('room_id', roomId)
      .eq('voter_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking if user voted:', error);
    return false;
  }
};

// Get voting progress for a room
export const getVotingProgress = async (roomId: string): Promise<{ totalPlayers: number; votedPlayers: number }> => {
  try {
    // Get total players
    const { data: playersData, error: playersError } = await supabase
      .from('game_players')
      .select('user_id')
      .eq('room_id', roomId);

    if (playersError) throw playersError;

    // Get unique voters
    const { data: votesData, error: votesError } = await supabase
      .from('game_votes')
      .select('voter_id')
      .eq('room_id', roomId);

    if (votesError) throw votesError;

    const totalPlayers = playersData?.length || 0;
    const votedPlayers = new Set(votesData?.map(v => v.voter_id)).size;

    return { totalPlayers, votedPlayers };
  } catch (error) {
    console.error('Error getting voting progress:', error);
    return { totalPlayers: 0, votedPlayers: 0 };
  }
};

// Force check voting completion (for debugging)
export const forceCheckVotingCompletion = async (): Promise<void> => {
  try {
    await supabase.rpc('check_voting_completion');
  } catch (error) {
    console.error('Error checking voting completion:', error);
  }
};

// Manual cleanup function (for testing)
export const runCleanup = async (): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('cleanup_inactive_rooms_and_sessions', {
      p_cleanup_type: 'manual'
    });

    if (error) throw error;
    
    if (data && data.length > 0) {
      const result = data[0];
      console.log('Cleanup completed:', result);
      toast.success(`Cleanup completed: ${result.cleaned_rooms} rooms, ${result.cleaned_sessions} sessions cleaned`);
    }
  } catch (error) {
    console.error('Error running cleanup:', error);
    toast.error('Failed to run cleanup');
  }
};
