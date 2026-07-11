// Hand-written from migrations 0001–0005.
// Regenerate after push:  supabase gen types typescript --linked > lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Database = {
  public: {
    Tables: {

      // ── Foundation (0001) ──────────────────────────────────────────
      users: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          role: 'owner' | 'staff' | 'practitioner'
          is_active: boolean
          notify_email: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          phone?: string | null
          role: 'owner' | 'staff' | 'practitioner'
          is_active?: boolean
          notify_email?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
        Relationships: []
      }

      clients: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          notes: string | null
          notify_email: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          notes?: string | null
          notify_email?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['clients']['Insert']>
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
          buffer_minutes: number
          max_concurrent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          category: 'pilates' | 'laser' | 'other'
          description?: string | null
          duration_minutes: number
          single_price_naira: number
          package_price_naira?: number | null
          package_session_count?: number | null
          color_hex?: string | null
          is_active?: boolean
          sort_order?: number
          buffer_minutes?: number
          max_concurrent?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['services']['Insert']>
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

      // ── Scheduling (0004) ──────────────────────────────────────────
      shifts: {
        Row: {
          id: string
          practitioner_id: string
          day_of_week: number
          start_time: string
          end_time: string
          effective_from: string
          effective_until: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          practitioner_id: string
          day_of_week: number
          start_time: string
          end_time: string
          effective_from?: string
          effective_until?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['shifts']['Insert']>
        Relationships: []
      }

      shift_overrides: {
        Row: {
          id: string
          practitioner_id: string
          override_date: string
          start_time: string | null
          end_time: string | null
          is_unavailable: boolean
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          practitioner_id: string
          override_date: string
          start_time?: string | null
          end_time?: string | null
          is_unavailable?: boolean
          reason?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['shift_overrides']['Insert']>
        Relationships: []
      }

      time_off: {
        Row: {
          id: string
          practitioner_id: string
          start_date: string
          end_date: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          practitioner_id: string
          start_date: string
          end_date: string
          reason?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['time_off']['Insert']>
        Relationships: []
      }

      appointments: {
        Row: {
          id: string
          client_id: string
          service_id: string
          practitioner_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null
          source: 'web' | 'admin' | 'phone'
          pricing_tier: 'single' | 'package'
          credit_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          service_id: string
          practitioner_id: string
          appointment_date: string
          start_time: string
          end_time: string
          status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes?: string | null
          source?: 'web' | 'admin' | 'phone'
          pricing_tier?: 'single' | 'package'
          credit_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>
        Relationships: []
      }

      client_credits: {
        Row: {
          id: string
          client_id: string
          service_id: string
          sessions_purchased: number
          sessions_used: number
          expires_at: string | null
          purchase_appointment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          service_id: string
          sessions_purchased: number
          sessions_used?: number
          expires_at?: string | null
          purchase_appointment_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['client_credits']['Insert']>
        Relationships: []
      }

      payments: {
        Row: {
          id: string
          appointment_id: string | null
          shop_order_id: string | null
          paystack_reference: string
          amount_kobo: number
          status: string
          channel: string | null
          verified_at: string | null
          raw_response: Json | null
          created_at: string
          refunded_amount_kobo: number
        }
        Insert: {
          id?: string
          appointment_id?: string | null
          shop_order_id?: string | null
          paystack_reference: string
          amount_kobo: number
          status?: string
          channel?: string | null
          verified_at?: string | null
          raw_response?: Json | null
          created_at?: string
          refunded_amount_kobo?: number
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
        Relationships: []
      }

      shop_orders: {
        Row: {
          id: string
          client_id: string | null
          items: Json
          total_kobo: number
          shipping_address: Json | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          items: Json
          total_kobo: number
          shipping_address?: Json | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['shop_orders']['Insert']>
        Relationships: []
      }

      audit_log: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>
        Relationships: []
      }

      invitations: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'owner' | 'staff' | 'practitioner'
          invited_by: string | null
          token: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: 'owner' | 'staff' | 'practitioner'
          invited_by?: string | null
          token?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
        Relationships: []
      }

    }
    Views: Record<never, never>
    Functions: {
      create_appointment_atomic: {
        Args: {
          p_full_name:             string
          p_email:                 string
          p_phone:                 string
          p_notes:                 string | null
          p_service_id:            string
          p_practitioner_id:       string
          p_appointment_date:      string
          p_start_time:            string
          p_end_time:              string
          p_pricing_tier:          string
          p_package_session_count?: number | null
          p_source?:               string
          p_credit_id?:            string | null
        }
        Returns: {
          appointment_id: string // uuid
          client_id:      string // uuid
          credit_id:      string | null // uuid
          new_credit_id:  string | null // uuid
        }[]
      }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

// Convenience row-type aliases
export type UserRow            = Database['public']['Tables']['users']['Row']
export type ClientRow          = Database['public']['Tables']['clients']['Row']
export type ServiceRow         = Database['public']['Tables']['services']['Row']
export type ShiftRow           = Database['public']['Tables']['shifts']['Row']
export type ShiftOverrideRow   = Database['public']['Tables']['shift_overrides']['Row']
export type TimeOffRow         = Database['public']['Tables']['time_off']['Row']
export type AppointmentRow     = Database['public']['Tables']['appointments']['Row']
export type ClientCreditRow    = Database['public']['Tables']['client_credits']['Row']
export type PaymentRow         = Database['public']['Tables']['payments']['Row']
export type ShopOrderRow       = Database['public']['Tables']['shop_orders']['Row']
export type InvitationRow      = Database['public']['Tables']['invitations']['Row']
