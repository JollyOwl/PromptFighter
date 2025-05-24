
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GameRoom, GamePhase } from '@/types/game';
import { toast } from 'sonner';
import { useActiveSession } from './useActiveSession';

interface UseRealtimeGameProps {
  roomId: string | null;
  onPhaseChange?: (phase: GamePhase) => void;
  onPlayerAction?: (action: any) => void;
}

export const useRealtimeGame = ({ roomId, onPhaseChange, onPlayerAction }: UseRealtimeGameProps) => {
  const { user } = useAuth();
  const [currentPhase, setCurrentPhase] = useState<GamePhase>('waiting');

  // Use the new active session hook
  const {
    currentSession,
    timeLeft,
    isOwner,
    updatePhase,
    fetchCurrentSession
  } = useActiveSession({
    roomId,
    onPhaseChange: (phase) => {
      setCurrentPhase(phase);
      if (onPhaseChange) {
        onPhaseChange(phase);
      }
    }
  });

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

  // Log player action
  const logPlayerAction = useCallback(async (actionType: string, actionData: any = {}) => {
    if (!roomId || !user) return;

    console.log('Player action:', { actionType, actionData, roomId, userId: user.id });
    // For now, we'll just log to console since we don't have a player_actions table
  }, [roomId, user]);

  // Set up real-time subscriptions for votes
  useEffect(() => {
    if (!roomId) return;

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

    return () => {
      votesChannel.unsubscribe();
    };
  }, [roomId, onPlayerAction]);

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
    currentSession: currentSession ? {
      id: currentSession.id,
      room_id: currentSession.room_id,
      current_phase: currentSession.current_phase,
      phase_start_time: currentSession.phase_start_time,
      phase_duration: currentSession.phase_duration,
      created_at: currentSession.start_time,
      updated_at: currentSession.updated_at
    } : null,
    timeLeft,
    isOwner,
    updatePhase,
    submitVote,
    logPlayerAction,
    fetchCurrentSession
  };
};
