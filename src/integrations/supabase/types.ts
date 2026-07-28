export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      baba_votes: {
        Row: {
          baba_id: string
          created_at: string
          id: string
          voted_for_id: string
          voter_id: string
        }
        Insert: {
          baba_id: string
          created_at?: string
          id?: string
          voted_for_id: string
          voter_id: string
        }
        Update: {
          baba_id?: string
          created_at?: string
          id?: string
          voted_for_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baba_votes_baba_id_fkey"
            columns: ["baba_id"]
            isOneToOne: false
            referencedRelation: "babas"
            referencedColumns: ["id"]
          },
        ]
      }
      babas: {
        Row: {
          best_goalkeeper_id: string | null
          best_player_id: string | null
          champion_team: string | null
          created_at: string
          created_by: string
          date: string
          end_time: string
          id: string
          is_open: boolean
          location: string
          max_goleiros: number
          max_linha_players: number
          pix_key: string | null
          price: number
          registration_opens_at: string | null
          start_time: string
          teams_data: Json | null
          title: string
          updated_at: string
          worst_player_id: string | null
        }
        Insert: {
          best_goalkeeper_id?: string | null
          best_player_id?: string | null
          champion_team?: string | null
          created_at?: string
          created_by: string
          date: string
          end_time?: string
          id?: string
          is_open?: boolean
          location: string
          max_goleiros?: number
          max_linha_players?: number
          pix_key?: string | null
          price: number
          registration_opens_at?: string | null
          start_time: string
          teams_data?: Json | null
          title: string
          updated_at?: string
          worst_player_id?: string | null
        }
        Update: {
          best_goalkeeper_id?: string | null
          best_player_id?: string | null
          champion_team?: string | null
          created_at?: string
          created_by?: string
          date?: string
          end_time?: string
          id?: string
          is_open?: boolean
          location?: string
          max_goleiros?: number
          max_linha_players?: number
          pix_key?: string | null
          price?: number
          registration_opens_at?: string | null
          start_time?: string
          teams_data?: Json | null
          title?: string
          updated_at?: string
          worst_player_id?: string | null
        }
        Relationships: []
      }
      player_achievements: {
        Row: {
          achieved_at: string
          achievement_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achieved_at?: string
          achievement_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achieved_at?: string
          achievement_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      player_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rated_id: string
          rater_id: string
          skill_rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_id: string
          rater_id: string
          skill_rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_id?: string
          rater_id?: string
          skill_rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          last_name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          baba_id: string
          id: string
          is_champion: boolean
          is_mensalista: boolean
          manual_name: string | null
          payment_proof_url: string | null
          position: Database["public"]["Enums"]["player_position"]
          registered_at: string
          status: Database["public"]["Enums"]["registration_status"]
          user_id: string | null
          waiting_position: number | null
        }
        Insert: {
          baba_id: string
          id?: string
          is_champion?: boolean
          is_mensalista?: boolean
          manual_name?: string | null
          payment_proof_url?: string | null
          position: Database["public"]["Enums"]["player_position"]
          registered_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          user_id?: string | null
          waiting_position?: number | null
        }
        Update: {
          baba_id?: string
          id?: string
          is_champion?: boolean
          is_mensalista?: boolean
          manual_name?: string | null
          payment_proof_url?: string | null
          position?: Database["public"]["Enums"]["player_position"]
          registered_at?: string
          status?: Database["public"]["Enums"]["registration_status"]
          user_id?: string | null
          waiting_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_baba_id_fkey"
            columns: ["baba_id"]
            isOneToOne: false
            referencedRelation: "babas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      player_statistics: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          best_goalkeeper_titles: number | null
          champion_wins: number | null
          craque_titles: number | null
          first_name: string | null
          last_name: string | null
          matches_as_goleiro: number | null
          matches_as_linha: number | null
          ranking_score: number | null
          total_matches: number | null
          total_ratings: number | null
          total_votes_received: number | null
          user_id: string | null
          worst_player_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      player_position: "linha" | "goleiro"
      registration_status: "inscrito" | "pago" | "confirmado" | "lista_espera"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      player_position: ["linha", "goleiro"],
      registration_status: ["inscrito", "pago", "confirmado", "lista_espera"],
    },
  },
} as const
