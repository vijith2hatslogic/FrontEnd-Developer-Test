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
      users: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          id: string
          title: string
          description: string
          experience_level: string
          tech_stacks: string[]
          total_time: number
          tasks: Json
          created_at: string
          test_url: string
          created_by: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          experience_level: string
          tech_stacks: string[]
          total_time: number
          tasks: Json
          created_at?: string
          test_url: string
          created_by: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          experience_level?: string
          tech_stacks?: string[]
          total_time?: number
          tasks?: Json
          created_at?: string
          test_url?: string
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      test_submissions: {
        Row: {
          id: string
          test_id: string
          candidate_name: string
          candidate_email: string
          candidate_phone: string | null
          years_of_experience: string
          task_submissions: Json
          submitted_at: string
          time_spent: number
        }
        Insert: {
          id?: string
          test_id: string
          candidate_name: string
          candidate_email: string
          candidate_phone?: string | null
          years_of_experience: string
          task_submissions: Json
          submitted_at?: string
          time_spent: number
        }
        Update: {
          id?: string
          test_id?: string
          candidate_name?: string
          candidate_email?: string
          candidate_phone?: string | null
          years_of_experience?: string
          task_submissions?: Json
          submitted_at?: string
          time_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_test_id_fkey"
            columns: ["test_id"]
            referencedRelation: "tests"
            referencedColumns: ["id"]
          }
        ]
      }
      auth_users: {
        Row: {
          id: string
          user_id: string
          password_hash: string
        }
        Insert: {
          id?: string
          user_id: string
          password_hash: string
        }
        Update: {
          id?: string
          user_id?: string
          password_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "auth_users_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
