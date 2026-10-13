export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      api_rate_limits: {
        Row: {
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          category: string
          created_at: string
          credential_id: string | null
          credential_url: string | null
          description: string
          file_data: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          hours: number | null
          id: string
          is_favorite: boolean
          issue_date: string
          issuer: string
          minutes: number | null
          skills: string[]
          title: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          description: string
          file_data?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          hours?: number | null
          id?: string
          is_favorite?: boolean
          issue_date: string
          issuer: string
          minutes?: number | null
          skills?: string[]
          title: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          credential_id?: string | null
          credential_url?: string | null
          description?: string
          file_data?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          hours?: number | null
          id?: string
          is_favorite?: boolean
          issue_date?: string
          issuer?: string
          minutes?: number | null
          skills?: string[]
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          category: string
          created_at: string
          dates: string[] | null
          deadline: string | null
          description: string
          external_link: string | null
          id: string
          link: string | null
          linked_post_id: string | null
          linked_post_ids: string[] | null
          points: number | null
          result: string | null
          result_image: string | null
          result_image_path: string | null
          result_link: string | null
          result_media_type: string
          result_platform: string | null
          social_links: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          dates?: string[] | null
          deadline?: string | null
          description?: string
          external_link?: string | null
          id?: string
          link?: string | null
          linked_post_id?: string | null
          linked_post_ids?: string[] | null
          points?: number | null
          result?: string | null
          result_image?: string | null
          result_image_path?: string | null
          result_link?: string | null
          result_media_type?: string
          result_platform?: string | null
          social_links?: Json | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          dates?: string[] | null
          deadline?: string | null
          description?: string
          external_link?: string | null
          id?: string
          link?: string | null
          linked_post_id?: string | null
          linked_post_ids?: string[] | null
          points?: number | null
          result?: string | null
          result_image?: string | null
          result_image_path?: string | null
          result_link?: string | null
          result_media_type?: string
          result_platform?: string | null
          social_links?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_linked_post_id_fkey"
            columns: ["linked_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          caption: string
          category: string
          created_at: string
          id: string
          image_data: string | null
          image_path: string | null
          media_type: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string
          category?: string
          created_at?: string
          id?: string
          image_data?: string | null
          image_path?: string | null
          media_type?: string
          taken_at?: string | null
          user_id?: string
        }
        Update: {
          caption?: string
          category?: string
          created_at?: string
          id?: string
          image_data?: string | null
          image_path?: string | null
          media_type?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hosted_events: {
        Row: {
          checklist_done: string[]
          created_at: string
          date: string
          duration_minutes: number
          format: string | null
          id: string
          location: string | null
          notes: string | null
          participants: number | null
          title: string
          updated_at: string
          user_id: string
          validation_done: string[]
        }
        Insert: {
          checklist_done?: string[]
          created_at?: string
          date: string
          duration_minutes?: number
          format?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          participants?: number | null
          title: string
          updated_at?: string
          user_id?: string
          validation_done?: string[]
        }
        Update: {
          checklist_done?: string[]
          created_at?: string
          date?: string
          duration_minutes?: number
          format?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          participants?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          validation_done?: string[]
        }
        Relationships: []
      }
      posts: {
        Row: {
          category: string
          comments: number | null
          content: string
          created_at: string
          hashtags: string[]
          id: string
          likes: number | null
          platform: string
          prompt_used: string | null
          published_url: string | null
          scheduled_date: string | null
          score: number | null
          social_links: Json | null
          status: string
          title: string
          tone: string
          updated_at: string
          user_id: string
          visual_idea: string | null
        }
        Insert: {
          category: string
          comments?: number | null
          content: string
          created_at?: string
          hashtags?: string[]
          id?: string
          likes?: number | null
          platform: string
          prompt_used?: string | null
          published_url?: string | null
          scheduled_date?: string | null
          score?: number | null
          social_links?: Json | null
          status: string
          title: string
          tone: string
          updated_at?: string
          user_id?: string
          visual_idea?: string | null
        }
        Update: {
          category?: string
          comments?: number | null
          content?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          likes?: number | null
          platform?: string
          prompt_used?: string | null
          published_url?: string | null
          scheduled_date?: string | null
          score?: number | null
          social_links?: Json | null
          status?: string
          title?: string
          tone?: string
          updated_at?: string
          user_id?: string
          visual_idea?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ambassador_seal_url: string
          avatar_url: string
          bio: string
          cohort: string
          course: string
          email: string
          github_url: string
          goal_2026: string
          id: string
          instagram_url: string
          is_public: boolean
          linkedin_url: string
          name: string
          public_slug: string | null
          role: string
          university: string
          updated_at: string
        }
        Insert: {
          ambassador_seal_url?: string
          avatar_url?: string
          bio?: string
          cohort?: string
          course?: string
          email?: string
          github_url?: string
          goal_2026?: string
          id: string
          instagram_url?: string
          is_public?: boolean
          linkedin_url?: string
          name?: string
          public_slug?: string | null
          role?: string
          university?: string
          updated_at?: string
        }
        Update: {
          ambassador_seal_url?: string
          avatar_url?: string
          bio?: string
          cohort?: string
          course?: string
          email?: string
          github_url?: string
          goal_2026?: string
          id?: string
          instagram_url?: string
          is_public?: boolean
          linkedin_url?: string
          name?: string
          public_slug?: string | null
          role?: string
          university?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_deadlines: {
        Row: {
          category: string
          created_at: string
          date: string
          id: string
          is_completed: boolean
          notes: string | null
          points: number | null
          title: string
          updated_at: string
          user_id: string
          week: number | null
        }
        Insert: {
          category?: string
          created_at?: string
          date: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          points?: number | null
          title: string
          updated_at?: string
          user_id?: string
          week?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          id?: string
          is_completed?: boolean
          notes?: string | null
          points?: number | null
          title?: string
          updated_at?: string
          user_id?: string
          week?: number | null
        }
        Relationships: []
      }
      prompt_docs: {
        Row: {
          created_at: string
          file_data: string | null
          file_path: string | null
          file_size: number | null
          file_type: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_data?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          file_data?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_favorite: boolean
          last_used: string | null
          prompt_text: string
          recommended_model: string
          section: string
          shared_docs: string[] | null
          tags: string[]
          title: string
          usage_count: number
          user_id: string
          variables: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          last_used?: string | null
          prompt_text: string
          recommended_model: string
          section: string
          shared_docs?: string[] | null
          tags?: string[]
          title: string
          usage_count?: number
          user_id?: string
          variables?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_favorite?: boolean
          last_used?: string | null
          prompt_text?: string
          recommended_model?: string
          section?: string
          shared_docs?: string[] | null
          tags?: string[]
          title?: string
          usage_count?: number
          user_id?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_notified_at: string | null
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_notified_at?: string | null
          p256dh: string
          user_id?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_notified_at?: string | null
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reference_links: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          shared_by: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          shared_by?: string | null
          title: string
          updated_at?: string
          url: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          shared_by?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          challenge: string | null
          challenge_files: Json | null
          created_at: string
          id: string
          proof_image: string | null
          proof_image_path: string | null
          proof_media_type: string
          score: number | null
          session_date: string
          title: string
          tool_learned: string
          updated_at: string
          user_id: string
        }
        Insert: {
          challenge?: string | null
          challenge_files?: Json | null
          created_at?: string
          id?: string
          proof_image?: string | null
          proof_image_path?: string | null
          proof_media_type?: string
          score?: number | null
          session_date: string
          title: string
          tool_learned?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          challenge?: string | null
          challenge_files?: Json | null
          created_at?: string
          id?: string
          proof_image?: string | null
          proof_image_path?: string | null
          proof_media_type?: string
          score?: number | null
          session_date?: string
          title?: string
          tool_learned?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_scores: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          points: number
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          points?: number
          updated_at?: string
          user_id?: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          points?: number
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_rate_limit: {
        Args: {
          p_max_requests: number
          p_user_id: string
          p_window_seconds: number
        }
        Returns: boolean
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
