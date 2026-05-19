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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      fitness_cardio: {
        Row: {
          bpm: number
          created_at: string
          day_id: string
          duration_min: number
          id: string
          name: string
          pace: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bpm?: number
          created_at?: string
          day_id: string
          duration_min?: number
          id?: string
          name?: string
          pace?: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bpm?: number
          created_at?: string
          day_id?: string
          duration_min?: number
          id?: string
          name?: string
          pace?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitness_cardio_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "fitness_days"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_days: {
        Row: {
          created_at: string
          id: string
          summary: string
          type: Database["public"]["Enums"]["workout_type"]
          updated_at: string
          user_id: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          summary?: string
          type?: Database["public"]["Enums"]["workout_type"]
          updated_at?: string
          user_id: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          summary?: string
          type?: Database["public"]["Enums"]["workout_type"]
          updated_at?: string
          user_id?: string
          weekday?: Database["public"]["Enums"]["weekday_enum"]
        }
        Relationships: []
      }
      fitness_lifts: {
        Row: {
          body_part: string
          created_at: string
          day_id: string
          id: string
          name: string
          position: number
          reps: number
          seat: string
          updated_at: string
          user_id: string
          weight: number
        }
        Insert: {
          body_part?: string
          created_at?: string
          day_id: string
          id?: string
          name?: string
          position?: number
          reps?: number
          seat?: string
          updated_at?: string
          user_id: string
          weight?: number
        }
        Update: {
          body_part?: string
          created_at?: string
          day_id?: string
          id?: string
          name?: string
          position?: number
          reps?: number
          seat?: string
          updated_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "fitness_lifts_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "fitness_days"
            referencedColumns: ["id"]
          },
        ]
      }
      life_goals: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          created_at: string
          horizon: string
          id: string
          notes: string
          position: number
          progress: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          created_at?: string
          horizon?: string
          id?: string
          notes?: string
          position?: number
          progress?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          created_at?: string
          horizon?: string
          id?: string
          notes?: string
          position?: number
          progress?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_tasks: {
        Row: {
          area: Database["public"]["Enums"]["life_area"]
          bucket: Database["public"]["Enums"]["task_bucket"]
          created_at: string
          done: boolean
          id: string
          position: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          area: Database["public"]["Enums"]["life_area"]
          bucket: Database["public"]["Enums"]["task_bucket"]
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          text?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["life_area"]
          bucket?: Database["public"]["Enums"]["task_bucket"]
          created_at?: string
          done?: boolean
          id?: string
          position?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meal_days: {
        Row: {
          calorie_goal: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Insert: {
          calorie_goal?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Update: {
          calorie_goal?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          weekday?: Database["public"]["Enums"]["weekday_enum"]
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          calories: number
          carb_g: number
          created_at: string
          day_id: string
          fat_g: number
          id: string
          name: string
          position: number
          protein_g: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number
          carb_g?: number
          created_at?: string
          day_id: string
          fat_g?: number
          id?: string
          name?: string
          position?: number
          protein_g?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number
          carb_g?: number
          created_at?: string
          day_id?: string
          fat_g?: number
          id?: string
          name?: string
          position?: number
          protein_g?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "meal_days"
            referencedColumns: ["id"]
          },
        ]
      }
      mental_actions: {
        Row: {
          created_at: string
          day_id: string
          done: boolean
          id: string
          position: number
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_id: string
          done?: boolean
          id?: string
          position?: number
          text?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_id?: string
          done?: boolean
          id?: string
          position?: number
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mental_actions_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "mental_days"
            referencedColumns: ["id"]
          },
        ]
      }
      mental_days: {
        Row: {
          created_at: string
          happiness: number
          id: string
          notes: string
          productivity: number
          stress: number
          therapy: string
          updated_at: string
          user_id: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Insert: {
          created_at?: string
          happiness?: number
          id?: string
          notes?: string
          productivity?: number
          stress?: number
          therapy?: string
          updated_at?: string
          user_id: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Update: {
          created_at?: string
          happiness?: number
          id?: string
          notes?: string
          productivity?: number
          stress?: number
          therapy?: string
          updated_at?: string
          user_id?: string
          weekday?: Database["public"]["Enums"]["weekday_enum"]
        }
        Relationships: []
      }
      sleep_days: {
        Row: {
          bedtime: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          wake_time: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Insert: {
          bedtime?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          wake_time?: string
          weekday: Database["public"]["Enums"]["weekday_enum"]
        }
        Update: {
          bedtime?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          wake_time?: string
          weekday?: Database["public"]["Enums"]["weekday_enum"]
        }
        Relationships: []
      }
      sleep_interruptions: {
        Row: {
          at: string
          created_at: string
          day_id: string
          id: string
          position: number
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          at?: string
          created_at?: string
          day_id: string
          id?: string
          position?: number
          reason?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          at?: string
          created_at?: string
          day_id?: string
          id?: string
          position?: number
          reason?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_interruptions_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "sleep_days"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data: {
        Row: {
          data: Json
          key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          key?: string
          updated_at?: string
          user_id?: string
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
      life_area: "personal" | "career" | "work"
      task_bucket: "this_week" | "later"
      weekday_enum: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
      workout_type: "Strength" | "Hypertrophy" | "Cardio" | "Rest"
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
      life_area: ["personal", "career", "work"],
      task_bucket: ["this_week", "later"],
      weekday_enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      workout_type: ["Strength", "Hypertrophy", "Cardio", "Rest"],
    },
  },
} as const
