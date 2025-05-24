
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GameRoom, GamePhase } from '@/types/game';
import { toast } from 'sonner';

interface GameSession {
  id: string;
  room_id: string;
  current_phase: GamePhase;
  phase_start_time: string;
  phase_duration: number;
  created_at: string;
  updated_at: string;
}

interface PlayerAction {
  id: string;
  room_id: string;
  player_id: string;
  action_type: 'join' | 'leave' | 'ready' | 'submit' | 'vote' | 'phase_change';
  action_data: any;
  created_at: string;
}

interface UseRealtimeGameProps {
  roomId: string | null;
  onPhaseChange?: (phase: GamePhase) => void;
  onPlayerAction?: (action: PlayerAction) => void;
}

export const useRealtimeGame = ({ roomId, onPhaseChange, onPlayerAction }: UseRealtimeGameProps) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  // Check if user is room owner
  useEffect(() => {
    if (!roomId || !user) return;

    const checkOwnership = async () => {
      const { data } = await supabase
        .from('game_rooms')
        .select('owner_id')
        .eq('id', roomId)
        .single();
      
      setIsOwner(data?.owner_id === user.id);
    };

    checkOwnership();
  }, [roomId, user]);

  // Fetch current game session
  const fetchCurrentSession = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching game session:', error);
      return;
    }

    if (data) {
      setCurrentSession(data as GameSession);
      
      // Calculate time left (only for phases with timeouts)
      if (data.current_phase !== 'voting') {
        const phaseStart = new Date(data.phase_start_time).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - phaseStart) / 1000);
        const remaining = Math.max(0, data.phase_duration - elapsed);
        setTimeLeft(remaining);
      } else {
        setTimeLeft(0); // No timeout for voting phase
      }
    }
  }, [roomId]);

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

  // Log player action
  const logPlayerAction = useCallback(async (actionType: PlayerAction['action_type'], actionData: any = {}) => {
    if (!roomId || !user) return;

    try {
      const { error } = await supabase
        .from('player_actions')
        .insert({
          room_id: roomId,
          player_id: user.id,
          action_type: actionType,
          action_data: actionData
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging player action:', error);
    }
  }, [roomId, user]);

  // Timer countdown effect (only for phases with timeouts)
  useEffect(() => {
    if (!currentSession || currentSession.current_phase === 'voting' || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Time's up - trigger auto-advance
          if (isOwner && currentSession.current_phase === 'playing') {
            updatePhase('voting');
          } else if (isOwner && currentSession.current_phase === 'results') {
            updatePhase('waiting');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession, timeLeft, isOwner, updatePhase]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to game session changes
    const sessionChannel = supabase
      .channel(`game_session_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_sessions',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Game session change:', payload);
          
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newSession = payload.new as GameSession;
            setCurrentSession(newSession);
            
            // Calculate time left for non-voting phases
            if (newSession.current_phase !== 'voting') {
              const phaseStart = new Date(newSession.phase_start_time).getTime();
              const now = Date.now();
              const elapsed = Math.floor((now - phaseStart) / 1000);
              const remaining = Math.max(0, newSession.phase_duration - elapsed);
              setTimeLeft(remaining);
            } else {
              setTimeLeft(0);
            }

            // Notify about phase change
            if (onPhaseChange) {
              onPhaseChange(newSession.current_phase);
            }
          }
        }
      )
      .subscribe();

    // Subscribe to player actions
    const actionsChannel = supabase
      .channel(`player_actions_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'player_actions',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Player action:', payload);
          
          const action = payload.new as PlayerAction;
          if (onPlayerAction) {
            onPlayerAction(action);
          }

          // Show toast for certain actions
          if (action.action_type === 'phase_change' && action.action_data?.auto_advanced) {
            const reason = action.action_data.reason;
            if (reason === 'timeout') {
              toast.info(`Game phase auto-advanced due to timeout`);
            } else if (reason === 'all_players_voted') {
              toast.info(`All players have voted! Moving to results.`);
            }
          }
        }
      )
      .subscribe();

    // Fetch initial session
    fetchCurrentSession();

    return () => {
      sessionChannel.unsubscribe();
      actionsChannel.unsubscribe();
    };
  }, [roomId, onPhaseChange, onPlayerAction, fetchCurrentSession]);

  // Check for timed out sessions periodically (room owners only)
  useEffect(() => {
    if (!isOwner) return;

    const checkTimeouts = async () => {
      try {
        await supabase.rpc('check_and_advance_game_phases');
      } catch (error) {
        console.error('Error checking timeouts:', error);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkTimeouts, 5000);
    return () => clearInterval(interval);
  }, [isOwner]);

  return {
    currentSession,
    timeLeft,
    isOwner,
    updatePhase,
    submitVote,
    logPlayerAction,
    fetchCurrentSession
  };
};
