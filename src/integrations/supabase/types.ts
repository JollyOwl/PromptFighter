export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      active_sessions: {
        Row: {
          current_phase: string | null
          id: string
          last_activity: string | null
          phase_duration: number | null
          phase_start_time: string | null
          room_id: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          current_phase?: string | null
          id?: string
          last_activity?: string | null
          phase_duration?: number | null
          phase_start_time?: string | null
          room_id?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          current_phase?: string | null
          id?: string
          last_activity?: string | null
          phase_duration?: number | null
          phase_start_time?: string | null
          room_id?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      cleanup_logs: {
        Row: {
          cleanup_details: Json | null
          cleanup_reason: string | null
          cleanup_timestamp: string | null
          cleanup_type: string
          created_at: string | null
          execution_time_ms: number | null
          id: string
          players_cleaned: number | null
          rooms_cleaned: number | null
          sessions_cleaned: number | null
          submissions_cleaned: number | null
          votes_cleaned: number | null
        }
        Insert: {
          cleanup_details?: Json | null
          cleanup_reason?: string | null
          cleanup_timestamp?: string | null
          cleanup_type: string
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          players_cleaned?: number | null
          rooms_cleaned?: number | null
          sessions_cleaned?: number | null
          submissions_cleaned?: number | null
          votes_cleaned?: number | null
        }
        Update: {
          cleanup_details?: Json | null
          cleanup_reason?: string | null
          cleanup_timestamp?: string | null
          cleanup_type?: string
          created_at?: string | null
          execution_time_ms?: number | null
          id?: string
          players_cleaned?: number | null
          rooms_cleaned?: number | null
          sessions_cleaned?: number | null
          submissions_cleaned?: number | null
          votes_cleaned?: number | null
        }
        Relationships: []
      }
      game_players: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string | null
          difficulty: string
          game_mode: string
          id: string
          join_code: string
          max_players: number
          name: string
          owner_id: string
          status: string
          target_image_url: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty: string
          game_mode: string
          id?: string
          join_code: string
          max_players?: number
          name: string
          owner_id: string
          status?: string
          target_image_url?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string
          game_mode?: string
          id?: string
          join_code?: string
          max_players?: number
          name?: string
          owner_id?: string
          status?: string
          target_image_url?: string | null
        }
        Relationships: []
      }
      game_submissions: {
        Row: {
          accuracy_score: number | null
          created_at: string | null
          id: string
          image_url: string
          player_id: string
          prompt: string
          room_id: string
          votes_received: number | null
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string | null
          id?: string
          image_url: string
          player_id: string
          prompt: string
          room_id: string
          votes_received?: number | null
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string | null
          id?: string
          image_url?: string
          player_id?: string
          prompt?: string
          room_id?: string
          votes_received?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "game_submissions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_submissions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_votes: {
        Row: {
          created_at: string | null
          id: string
          room_id: string
          submission_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          room_id: string
          submission_id: string
          voter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          room_id?: string
          submission_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "game_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      player_scores: {
        Row: {
          avg_accuracy_score: number | null
          games_won: number | null
          id: string
          player_id: string
          total_accuracy_score: number | null
          total_games: number | null
          total_votes_received: number | null
          updated_at: string | null
        }
        Insert: {
          avg_accuracy_score?: number | null
          games_won?: number | null
          id?: string
          player_id: string
          total_accuracy_score?: number | null
          total_games?: number | null
          total_votes_received?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_accuracy_score?: number | null
          games_won?: number | null
          id?: string
          player_id?: string
          total_accuracy_score?: number | null
          total_games?: number | null
          total_votes_received?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      target_images: {
        Row: {
          category: string | null
          created_at: string | null
          difficulty: string
          id: string
          name: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          difficulty: string
          id?: string
          name: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          difficulty?: string
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_advance_timed_out_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          room_id: string
          old_phase: string
          new_phase: string
        }[]
      }
      check_voting_completion: {
        Args: Record<PropertyKey, never>
        Returns: {
          room_id: string
          advanced: boolean
        }[]
      }
      cleanup_inactive_rooms_and_sessions: {
        Args: { p_cleanup_type?: string }
        Returns: {
          cleanup_id: string
          cleaned_rooms: number
          cleaned_sessions: number
          cleaned_players: number
          cleaned_votes: number
          cleaned_submissions: number
          execution_time_ms: number
        }[]
      }
      update_game_phase: {
        Args: { p_room_id: string; p_new_phase: string; p_duration?: number }
        Returns: {
          success: boolean
          message: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
