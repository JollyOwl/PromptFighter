
export interface GameSession {
  id: string;
  room_id: string;
  current_phase: 'waiting' | 'playing' | 'voting' | 'results';
  phase_start_time: string;
  phase_duration: number;
  created_at: string;
  updated_at: string;
}

export interface ActiveSession {
  id: string;
  room_id: string;
  current_phase: 'waiting' | 'playing' | 'voting' | 'results';
  phase_start_time: string;
  phase_duration: number;
  start_time: string;
  last_activity: string;
  updated_at: string;
}

export interface PlayerAction {
  action_type: 'join' | 'leave' | 'ready' | 'submit' | 'vote' | 'phase_change';
  action_data: Record<string, any>;
}

export interface RealtimeGameState {
  session: GameSession | null;
  timeLeft: number;
  isOwner: boolean;
  votingProgress: {
    totalPlayers: number;
    votedPlayers: number;
  };
}

export interface CleanupResult {
  cleanup_id: string;
  cleaned_rooms: number;
  cleaned_sessions: number;
  cleaned_players: number;
  cleaned_votes: number;
  cleaned_submissions: number;
  execution_time_ms: number;
}
