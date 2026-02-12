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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      component_sources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          file_path: string
          id: string
          name: string
          source_code: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          file_path: string
          id?: string
          name: string
          source_code: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          file_path?: string
          id?: string
          name?: string
          source_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      dev_conversations: {
        Row: {
          created_at: string
          id: string
          lesson_context: Json | null
          page_context: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_context?: Json | null
          page_context?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_context?: Json | null
          page_context?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      dev_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dev_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_results: {
        Row: {
          correct_answer: string | null
          created_at: string
          exercise_type: string
          id: string
          is_correct: boolean
          session_id: string | null
          time_spent_ms: number | null
          user_answer: string | null
          user_id: string
          word: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          exercise_type: string
          id?: string
          is_correct: boolean
          session_id?: string | null
          time_spent_ms?: number | null
          user_answer?: string | null
          user_id: string
          word: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          exercise_type?: string
          id?: string
          is_correct?: boolean
          session_id?: string | null
          time_spent_ms?: number | null
          user_answer?: string | null
          user_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "practice_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      face_analyses: {
        Row: {
          brand_fit: string
          chin_direction: string | null
          created_at: string
          energy_level: string
          expression_intensity: number | null
          eye_expression: string | null
          facial_description: string
          gaze_direction: string | null
          id: string
          image_id: string
          image_name: string
          image_src: string
          marketing_use_cases: Json
          mouth_state: string | null
          primary_emotion: string
          sarcasm_level: string | null
          secondary_tag: string
          suggested_vocabulary: Json
          updated_at: string
        }
        Insert: {
          brand_fit: string
          chin_direction?: string | null
          created_at?: string
          energy_level: string
          expression_intensity?: number | null
          eye_expression?: string | null
          facial_description: string
          gaze_direction?: string | null
          id?: string
          image_id: string
          image_name: string
          image_src: string
          marketing_use_cases?: Json
          mouth_state?: string | null
          primary_emotion: string
          sarcasm_level?: string | null
          secondary_tag: string
          suggested_vocabulary?: Json
          updated_at?: string
        }
        Update: {
          brand_fit?: string
          chin_direction?: string | null
          created_at?: string
          energy_level?: string
          expression_intensity?: number | null
          eye_expression?: string | null
          facial_description?: string
          gaze_direction?: string | null
          id?: string
          image_id?: string
          image_name?: string
          image_src?: string
          marketing_use_cases?: Json
          mouth_state?: string | null
          primary_emotion?: string
          sarcasm_level?: string | null
          secondary_tag?: string
          suggested_vocabulary?: Json
          updated_at?: string
        }
        Relationships: []
      }
      generation_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          idiom_id: string
          max_attempts: number
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idiom_id: string
          max_attempts?: number
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          idiom_id?: string
          max_attempts?: number
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      instagram_idioms: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          idiom: string
          scene: string
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          idiom: string
          scene: string
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          idiom?: string
          scene?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_idioms_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "marketing_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      kuba_base_images: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string
          is_builtin: boolean
          name: string
          storage_path: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url: string
          is_builtin?: boolean
          name: string
          storage_path: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string
          is_builtin?: boolean
          name?: string
          storage_path?: string
        }
        Relationships: []
      }
      lesson_exercises_cache: {
        Row: {
          created_at: string
          exercises: Json
          id: string
          lesson_category: string | null
          lesson_id: string
          lesson_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          exercises: Json
          id?: string
          lesson_category?: string | null
          lesson_id: string
          lesson_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          exercises?: Json
          id?: string
          lesson_category?: string | null
          lesson_id?: string
          lesson_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          cefr: string
          created_at: string
          datocms_id: string
          id: string
          kind: string
          level: string
          name: string
          order: number
          summary: Json | null
          updated_at: string
          video_upload_id: string
        }
        Insert: {
          cefr: string
          created_at?: string
          datocms_id: string
          id?: string
          kind: string
          level: string
          name: string
          order: number
          summary?: Json | null
          updated_at?: string
          video_upload_id: string
        }
        Update: {
          cefr?: string
          created_at?: string
          datocms_id?: string
          id?: string
          kind?: string
          level?: string
          name?: string
          order?: number
          summary?: Json | null
          updated_at?: string
          video_upload_id?: string
        }
        Relationships: []
      }
      marketing_creatives: {
        Row: {
          created_at: string
          id: string
          idea_id: string
          image_url: string
          is_selected: boolean
          metadata: Json | null
          transparent_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          idea_id: string
          image_url: string
          is_selected?: boolean
          metadata?: Json | null
          transparent_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          idea_id?: string
          image_url?: string
          is_selected?: boolean
          metadata?: Json | null
          transparent_url?: string | null
        }
        Relationships: []
      }
      marketing_ideas: {
        Row: {
          created_at: string
          description: string
          id: string
          inspiration_image_url: string | null
          notes: string | null
          status: string
          target_format: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          inspiration_image_url?: string | null
          notes?: string | null
          status?: string
          target_format?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          inspiration_image_url?: string | null
          notes?: string | null
          status?: string
          target_format?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_inspirations: {
        Row: {
          created_at: string
          file_name: string | null
          id: string
          idea_id: string
          image_url: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          id?: string
          idea_id: string
          image_url: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          id?: string
          idea_id?: string
          image_url?: string
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          completed_at: string
          duration_seconds: number | null
          exercise_types: string[] | null
          id: string
          lesson_id: string | null
          lesson_name: string | null
          score: number
          total_exercises: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          duration_seconds?: number | null
          exercise_types?: string[] | null
          id?: string
          lesson_id?: string | null
          lesson_name?: string | null
          score: number
          total_exercises: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          duration_seconds?: number | null
          exercise_types?: string[] | null
          id?: string
          lesson_id?: string | null
          lesson_name?: string | null
          score?: number
          total_exercises?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      prompt_learnings: {
        Row: {
          category: string | null
          created_at: string
          feedback: string
          id: string
          success_count: number | null
          updated_at: string
          word: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          feedback: string
          id?: string
          success_count?: number | null
          updated_at?: string
          word: string
        }
        Update: {
          category?: string | null
          created_at?: string
          feedback?: string
          id?: string
          success_count?: number | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      sticker_variants: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_selected: boolean
          lesson_kind: string | null
          lesson_name: string | null
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_selected?: boolean
          lesson_kind?: string | null
          lesson_name?: string | null
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_selected?: boolean
          lesson_kind?: string | null
          lesson_name?: string | null
          word?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_practice_date: string | null
          level: number
          longest_streak: number
          total_correct_answers: number
          total_exercises_completed: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          level?: number
          longest_streak?: number
          total_correct_answers?: number
          total_exercises_completed?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_practice_date?: string | null
          level?: number
          longest_streak?: number
          total_correct_answers?: number
          total_exercises_completed?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vocabulary_stickers: {
        Row: {
          created_at: string
          id: string
          image_url: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          word?: string
        }
        Relationships: []
      }
      word_audio_cache: {
        Row: {
          audio_url: string
          created_at: string
          id: string
          language: string
          voice_id: string
          word: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          id?: string
          language?: string
          voice_id: string
          word: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          id?: string
          language?: string
          voice_id?: string
          word?: string
        }
        Relationships: []
      }
      word_mastery: {
        Row: {
          correct_count: number
          created_at: string
          ease_factor: number
          id: string
          incorrect_count: number
          interval_days: number
          last_reviewed_at: string | null
          lesson_id: string | null
          mastery_level: string
          next_review_at: string
          repetition_count: number
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_id?: string | null
          mastery_level?: string
          next_review_at?: string
          repetition_count?: number
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          correct_count?: number
          created_at?: string
          ease_factor?: number
          id?: string
          incorrect_count?: number
          interval_days?: number
          last_reviewed_at?: string | null
          lesson_id?: string | null
          mastery_level?: string
          next_review_at?: string
          repetition_count?: number
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
