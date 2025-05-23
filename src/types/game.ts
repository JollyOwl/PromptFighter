export type Difficulty = "easy" | "medium" | "hard";
export type GameMode = "solo" | "duel" | "team";
export type GamePhase = "waiting" | "playing" | "voting" | "results";

export interface Player {
  id: string;
  username: string;
  avatar_url?: string;
  score?: number;
}

export interface TargetImage {
  id: string;
  url: string;
  difficulty: Difficulty;
  category?: string;
  name: string;
}

export interface GameRoom {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  game_mode: GameMode;
  difficulty: Difficulty;
  status: GamePhase;
  target_image_id?: string;
  target_image?: TargetImage;
  target_image_url?: string;
  join_code: string;
  max_players: number;
  players: Player[];
  playerCount?: number;
}

export interface GameSubmission {
  player_id: string;
  room_id: string;
  prompt: string;
  image_url: string;
  accuracy_score: number;
  votes_received: number;
}

export type Point = {
  x: number;
  y: number;
};
