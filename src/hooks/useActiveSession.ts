
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { GamePhase } from '@/types/game';
import { toast } from 'sonner';

interface ActiveSession {
  id: string;
  room_id: string;
  current_phase: GamePhase;
  phase_start_time: string;
  phase_duration: number;
  start_time: string;
  last_activity: string;
  updated_at: string;
}

interface UseActiveSessionProps {
  roomId: string | null;
  onPhaseChange?: (phase: GamePhase) => void;
  onSessionUpdate?: (session: ActiveSession) => void;
}

export const useActiveSession = ({ roomId, onPhaseChange, onSessionUpdate }: UseActiveSessionProps) => {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ActiveSession | null>(null);
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
      
      if (data) {
        setIsOwner(data.owner_id === user.id);
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

  // Calculate time left in current phase
  const calculateTimeLeft = useCallback((session: ActiveSession): number => {
    if (!session.phase_start_time || !session.phase_duration) return 0;
    
    const startTime = new Date(session.phase_start_time).getTime();
    const duration = session.phase_duration * 1000; // Convert to milliseconds
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, duration - elapsed);
    
    return Math.floor(remaining / 1000); // Return in seconds
  }, []);

  // Fetch current session
  const fetchCurrentSession = useCallback(async () => {
    if (!roomId) return;

    const { data, error } = await supabase
      .from('active_sessions')
      .select('*')
      .eq('room_id', roomId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching session:', error);
      return;
    }

    if (data) {
      const session = data as ActiveSession;
      setCurrentSession(session);
      setTimeLeft(calculateTimeLeft(session));
      
      if (onSessionUpdate) {
        onSessionUpdate(session);
      }
      
      if (onPhaseChange) {
        onPhaseChange(session.current_phase);
      }
    }
  }, [roomId, calculateTimeLeft, onSessionUpdate, onPhaseChange]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!roomId) return;

    // Subscribe to active session changes
    const sessionChannel = supabase
      .channel(`active_session_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_sessions',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          console.log('Active session change:', payload);
          
          if (payload.new) {
            const session = payload.new as ActiveSession;
            setCurrentSession(session);
            setTimeLeft(calculateTimeLeft(session));
            
            if (onSessionUpdate) {
              onSessionUpdate(session);
            }
            
            if (onPhaseChange) {
              onPhaseChange(session.current_phase);
            }
          }
        }
      )
      .subscribe();

    // Fetch initial session
    fetchCurrentSession();

    return () => {
      sessionChannel.unsubscribe();
    };
  }, [roomId, calculateTimeLeft, onSessionUpdate, onPhaseChange, fetchCurrentSession]);

  // Update time left every second
  useEffect(() => {
    if (!currentSession || timeLeft <= 0) return;

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(currentSession);
      setTimeLeft(newTimeLeft);
      
      // If time runs out, refresh session to check for auto-phase changes
      if (newTimeLeft <= 0) {
        fetchCurrentSession();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession, timeLeft, calculateTimeLeft, fetchCurrentSession]);

  return {
    currentSession,
    timeLeft,
    isOwner,
    updatePhase,
    fetchCurrentSession
  };
};
