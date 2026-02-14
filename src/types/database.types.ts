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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      actions: {
        Row: {
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string | null
          days_per_week: number | null
          duration: number | null
          frequency: string | null
          goal_id: string | null
          id: string
          time: string | null
          time_of_day: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          days_per_week?: number | null
          duration?: number | null
          frequency?: string | null
          goal_id?: string | null
          id?: string
          time?: string | null
          time_of_day?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          days_per_week?: number | null
          duration?: number | null
          frequency?: string | null
          goal_id?: string | null
          id?: string
          time?: string | null
          time_of_day?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_activities: {
        Row: {
          canonical_name: string | null
          challenge_id: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          order_index: number | null
          title: string
        }
        Insert: {
          canonical_name?: string | null
          challenge_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          title: string
        }
        Update: {
          canonical_name?: string | null
          challenge_id?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          order_index?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_activities_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_activity_types: {
        Row: {
          activity_key: string
          challenge_id: string | null
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          emoji: string | null
          id: string
          is_active: boolean | null
          max_daily: number | null
          points: number
          proof_type: string | null
          requires_proof: boolean | null
          sort_order: number | null
          time_window_end: string | null
          time_window_start: string | null
        }
        Insert: {
          activity_key: string
          challenge_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          max_daily?: number | null
          points?: number
          proof_type?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          time_window_end?: string | null
          time_window_start?: string | null
        }
        Update: {
          activity_key?: string
          challenge_id?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          emoji?: string | null
          id?: string
          is_active?: boolean | null
          max_daily?: number | null
          points?: number
          proof_type?: string | null
          requires_proof?: boolean | null
          sort_order?: number | null
          time_window_end?: string | null
          time_window_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_activity_types_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_completions: {
        Row: {
          activity_id: string | null
          completion_date: string | null
          created_at: string | null
          id: string
          linked_action_completion_id: string | null
          participant_id: string | null
        }
        Insert: {
          activity_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          linked_action_completion_id?: string | null
          participant_id?: string | null
        }
        Update: {
          activity_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          id?: string
          linked_action_completion_id?: string | null
          participant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "challenge_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "challenge_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          activity_times: Json | null
          challenge_id: string | null
          consistency_percentage: number | null
          current_streak: number | null
          id: string
          joined_at: string | null
          linked_action_ids: string[] | null
          selected_activity_ids: string[] | null
          total_completions: number | null
          user_id: string | null
        }
        Insert: {
          activity_times?: Json | null
          challenge_id?: string | null
          consistency_percentage?: number | null
          current_streak?: number | null
          id?: string
          joined_at?: string | null
          linked_action_ids?: string[] | null
          selected_activity_ids?: string[] | null
          total_completions?: number | null
          user_id?: string | null
        }
        Update: {
          activity_times?: Json | null
          challenge_id?: string | null
          consistency_percentage?: number | null
          current_streak?: number | null
          id?: string
          joined_at?: string | null
          linked_action_ids?: string[] | null
          selected_activity_ids?: string[] | null
          total_completions?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_rules: {
        Row: {
          challenge_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          rule_type: string | null
          threshold: number | null
          value: number | null
        }
        Insert: {
          challenge_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_type?: string | null
          threshold?: number | null
          value?: number | null
        }
        Update: {
          challenge_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_type?: string | null
          threshold?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_rules_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          circle_id: string | null
          config: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          name: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          circle_id?: string | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          circle_id?: string | null
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_members: {
        Row: {
          circle_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          circle_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          circle_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "circle_members_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      circles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          invite_code: string
          is_active: boolean | null
          member_count: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code: string
          is_active?: boolean | null
          member_count?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          invite_code?: string
          is_active?: boolean | null
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          deadline: string
          id: string
          metric: string
          progress: number | null
          title: string
          updated_at: string | null
          user_id: string
          why: string | null
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          deadline: string
          id?: string
          metric: string
          progress?: number | null
          title: string
          updated_at?: string | null
          user_id: string
          why?: string | null
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          deadline?: string
          id?: string
          metric?: string
          progress?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          action_title: string | null
          challenge_id: string | null
          challenge_name: string | null
          challenge_progress: string | null
          circle_id: string | null
          content: string
          created_at: string | null
          goal_color: string | null
          goal_title: string | null
          id: string
          is_challenge: boolean | null
          leaderboard_position: number | null
          media_url: string | null
          streak: number | null
          total_participants: number | null
          type: string
          user_id: string
          visibility: string | null
        }
        Insert: {
          action_title?: string | null
          challenge_id?: string | null
          challenge_name?: string | null
          challenge_progress?: string | null
          circle_id?: string | null
          content: string
          created_at?: string | null
          goal_color?: string | null
          goal_title?: string | null
          id?: string
          is_challenge?: boolean | null
          leaderboard_position?: number | null
          media_url?: string | null
          streak?: number | null
          total_participants?: number | null
          type: string
          user_id: string
          visibility?: string | null
        }
        Update: {
          action_title?: string | null
          challenge_id?: string | null
          challenge_name?: string | null
          challenge_progress?: string | null
          circle_id?: string | null
          content?: string
          created_at?: string | null
          goal_color?: string | null
          goal_title?: string | null
          id?: string
          is_challenge?: boolean | null
          leaderboard_position?: number | null
          media_url?: string | null
          streak?: number | null
          total_participants?: number | null
          type?: string
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          circle_id: string | null
          created_at: string | null
          email: string
          follower_count: number | null
          following_count: number | null
          id: string
          is_private: boolean | null
          name: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          circle_id?: string | null
          created_at?: string | null
          email: string
          follower_count?: number | null
          following_count?: number | null
          id: string
          is_private?: boolean | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          circle_id?: string | null
          created_at?: string | null
          email?: string
          follower_count?: number | null
          following_count?: number | null
          id?: string
          is_private?: boolean | null
          name?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_circle_id_fkey"
            columns: ["circle_id"]
            isOneToOne: false
            referencedRelation: "circles"
            referencedColumns: ["id"]
          },
        ]
      }
      reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          goal_id: string | null
          id: string
          last_completed: string | null
          longest_streak: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          goal_id?: string | null
          id?: string
          last_completed?: string | null
          longest_streak?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          goal_id?: string | null
          id?: string
          last_completed?: string | null
          longest_streak?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_challenge_activity: {
        Args: {
          p_activity_key: string
          p_challenge_id: string
          p_notes?: string
          p_proof_url?: string
          p_proof_value?: string
          p_user_id: string
        }
        Returns: Json
      }
      create_challenge: {
        Args: {
          p_activities: Json
          p_circle_id: string
          p_created_by: string
          p_description: string
          p_name: string
          p_rules: Json
        }
        Returns: string
      }
      generate_invite_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      join_circle_with_code: {
        Args: { code: string }
        Returns: Json
      }
    }
    Enums: {
      post_visibility: "private" | "circle" | "followers"
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
      post_visibility: ["private", "circle", "followers"],
    },
  },
} as const
