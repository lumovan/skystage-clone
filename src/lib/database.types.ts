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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          user_type: 'customer' | 'operator' | 'artist'
          company_name: string | null
          bio: string | null
          website: string | null
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          user_type: 'customer' | 'operator' | 'artist'
          company_name?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          user_type?: 'customer' | 'operator' | 'artist'
          company_name?: string | null
          bio?: string | null
          website?: string | null
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      formations: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          thumbnail_url: string | null
          file_url: string | null
          drone_count: number
          duration: number
          rating: number
          downloads: number
          price: number | null
          created_by: string
          is_public: boolean
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          thumbnail_url?: string | null
          file_url?: string | null
          drone_count: number
          duration: number
          rating?: number
          downloads?: number
          price?: number | null
          created_by: string
          is_public?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          thumbnail_url?: string | null
          file_url?: string | null
          drone_count?: number
          duration?: number
          rating?: number
          downloads?: number
          price?: number | null
          created_by?: string
          is_public?: boolean
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          user_id: string
          event_name: string | null
          event_date: string | null
          location: string | null
          budget_range: string | null
          message: string | null
          status: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'
          quoted_price: number | null
          operator_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_name?: string | null
          event_date?: string | null
          location?: string | null
          budget_range?: string | null
          message?: string | null
          status?: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'
          quoted_price?: number | null
          operator_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_name?: string | null
          event_date?: string | null
          location?: string | null
          budget_range?: string | null
          message?: string | null
          status?: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'
          quoted_price?: number | null
          operator_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      shows: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          formations: Json
          music_url: string | null
          total_duration: number
          is_public: boolean
          thumbnail_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          formations: Json
          music_url?: string | null
          total_duration: number
          is_public?: boolean
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          formations?: Json
          music_url?: string | null
          total_duration?: number
          is_public?: boolean
          thumbnail_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      formation_favorites: {
        Row: {
          id: string
          user_id: string
          formation_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          formation_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          formation_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    (...args: unknown[]) => unknowns: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'customer' | 'operator' | 'artist'
      booking_status: 'pending' | 'quoted' | 'confirmed' | 'completed' | 'cancelled'
    }
  }
}
