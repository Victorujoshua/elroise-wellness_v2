// Hand-written from migrations 0001–0003.
// Regenerate after supabase link:  supabase gen types typescript --linked > lib/database.types.ts

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'owner' | 'staff' | 'practitioner'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }
      practitioner_services: {
        Row: {
          practitioner_id: string
          service_id: string
        }
        Insert: {
          practitioner_id: string
          service_id: string
        }
        Update: Partial<Database['public']['Tables']['practitioner_services']['Insert']>
        Relationships: []
      }
      services: {
        Row: {
          id: string
          name: string
          slug: string
          category: 'pilates' | 'laser' | 'other'
          description: string | null
          duration_minutes: number
          single_price_naira: number
          package_price_naira: number | null
          package_session_count: number | null
          color_hex: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['services']['Row'], 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['services']['Insert']>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

export type ServiceRow = Database['public']['Tables']['services']['Row']
export type UserRow = Database['public']['Tables']['users']['Row']
