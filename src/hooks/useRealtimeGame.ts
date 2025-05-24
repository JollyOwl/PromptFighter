
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GameRoom, GamePhase } from '@/types/game';
import { toast } from 'sonner';

interface UseRealtimeGameProps {
  roomId: string | null;
  onPhaseChange?: (phase: GamePhase) => void;
  onPlayerAction?: (action: any) => void;
}

export const useRealtimeGame = ({ roomId, onPhaseChange, onPlayerAction }: UseRealtimeGameProps) => {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('waiting');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Check if user is room owner
  useEffect(() => {
    if (!roomId || !user) return;

    const checkOwnership = async () => {
      const { data } = await supabase
        .from('game_rooms')
        .select('owner_id, status')
        .eq('id', roomId)
        .single();
      
      if (data) {
        setIsOwner(data.owner_id === user.id);
        setCurrentPhase(data.status as GamePhase);
      }
    };

    checkOwnership();
  }, [roomId, user]);

  // Update game phase (only room owner)
  const updatePhase = useCallback(async (newPhase: GamePhase, duration?: number) => {
    if (!roomId || !isOwner) {
      toast.error('Only room owner can change game phase');
      return false;
    }

    try {
      const { data, error } = await supabase.rpc('update_game_phase', {
        p_room_id: roomId,
        p_new_phase: newPhase,
        p_duration: duration || 180
      });

      if (error) throw error;

      const result = data?.[0];
      if (result?.success) {
        toast.success(result.message);
        return true;
      } else {
        toast.error(result?.message || 'Failed to update phase');
        return false;
      }
    } catch (error) {
      console.error('Error updating phase:', error);
      toast.error('Failed to update game phase');
      return false;
    }
  }, [roomId, isOwner]);

  // Submit a vote
  const submitVote = useCallback(async (submissionId: string) => {
    if (!roomId || !user) return false;

    try {
      const { error } = await supabase
        .from('game_votes')
        .insert({
          room_id: roomId,
          voter_id: user.id,
          submission_id: submissionId
        });

      if (error) throw error;

      toast.success('Vote submitted successfully');
      return true;
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
      return false;
    }
  }, [roomId, user]);

  // Log player action (using game_votes or game_submissions as activity tracking)
  const logPlayerAction = useCallback(async (actionType: string, actionData: any = {}) => {
    if (!roomId || !user) return;

    console.log('Player action:', { actionType, actionData, roomId, userId: user.id });
    // For now, we'll just log to console since we don't have a player_actions table
  }, [roomId, user]);

  // Fetch current room status
  const fetchCurrentSession = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from('game_rooms')
      .select('status')
      .eq('id', roomId)
      .single();

    if (error) {
      console.error('Error fetching room status:', error);
      return;
    }

    if (data) {
      setCurrentPhase(data.status as GamePhase);
    }
  }, [roomId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to game room status changes
    const roomChannel = supabase
      .channel(`game_room_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('Game room change:', payload);
          
          if (payload.new && payload.new.status) {
            const newPhase = payload.new.status as GamePhase;
            setCurrentPhase(newPhase);
            
            // Notify about phase change
            if (onPhaseChange) {
              onPhaseChange(newPhase);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to votes to track voting progress
    const votesChannel = supabase
      .channel(`game_votes_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_votes',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Vote cast:', payload);
          
          if (onPlayerAction) {
            onPlayerAction({
              action_type: 'vote',
              action_data: payload.new
            });
          }
        }
      )
      .subscribe();

    // Fetch initial session
    fetchCurrentSession();

    return () => {
      roomChannel.unsubscribe();
      votesChannel.unsubscribe();
    };
  }, [roomId, onPhaseChange, onPlayerAction, fetchCurrentSession]);

  // Check for voting completion periodically (room owners only)
  useEffect(() => {
    if (!isOwner || currentPhase !== 'voting') return;

    const checkVotingCompletion = async () => {
      try {
        await supabase.rpc('check_voting_completion');
      } catch (error) {
        console.error('Error checking voting completion:', error);
      }
    };

    // Check every 3 seconds during voting phase
    const interval = setInterval(checkVotingCompletion, 3000);
    return () => clearInterval(interval);
  }, [isOwner, currentPhase]);

  return {
    currentSession: {
      id: roomId || '',
      room_id: roomId || '',
      current_phase: currentPhase,
      phase_start_time: new Date().toISOString(),
      phase_duration: 180,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    timeLeft,
    isOwner,
    updatePhase,
    submitVote,
    logPlayerAction,
    fetchCurrentSession
  };
};
