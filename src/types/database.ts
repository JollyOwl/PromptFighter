
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      game_rooms: {
        Row: {
          id: string
          name: string
          created_at: string
          owner_id: string
          game_mode: string
          difficulty: string
          status: string
          target_image_url: string
          join_code: string
          max_players: number
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          owner_id: string
          game_mode: string
          difficulty: string
          status?: string
          target_image_url?: string
          join_code: string
          max_players?: number
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          owner_id?: string
          game_mode?: string
          difficulty?: string
          status?: string
          target_image_url?: string
          join_code?: string
          max_players?: number
        }
      }
      game_players: {
        Row: {
          id: string
          room_id: string
          user_id: string
          joined_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          joined_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          joined_at?: string
        }
      }
      game_submissions: {
        Row: {
          id: string
          room_id: string
          player_id: string
          prompt: string
          image_url: string
          accuracy_score: number
          votes_received: number
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          player_id: string
          prompt: string
          image_url: string
          accuracy_score?: number
          votes_received?: number
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          player_id?: string
          prompt?: string
          image_url?: string
          accuracy_score?: number
          votes_received?: number
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
