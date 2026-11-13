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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          business_id: string
          clicks: number
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          image_url: string
          impressions: number
          notes: string | null
          placement: string
          reviewed_by: string | null
          start_date: string
          status: string
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          business_id: string
          clicks?: number
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          image_url: string
          impressions?: number
          notes?: string | null
          placement: string
          reviewed_by?: string | null
          start_date: string
          status?: string
          target_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          clicks?: number
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          image_url?: string
          impressions?: number
          notes?: string | null
          placement?: string
          reviewed_by?: string | null
          start_date?: string
          status?: string
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body_en: string
          body_ur: string
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          is_active: boolean
          link_url: string | null
          start_date: string
          title_en: string
          title_ur: string
          updated_at: string
        }
        Insert: {
          body_en: string
          body_ur: string
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          start_date: string
          title_en: string
          title_ur: string
          updated_at?: string
        }
        Update: {
          body_en?: string
          body_ur?: string
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          is_active?: boolean
          link_url?: string | null
          start_date?: string
          title_en?: string
          title_ur?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_ur: string
          slug: string
          updated_at: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_ur: string
          slug: string
          updated_at?: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_ur?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_events: {
        Row: {
          ad_id: string | null
          business_id: string
          created_at: string
          event_type: string
          id: string
          session_id: string
        }
        Insert: {
          ad_id?: string | null
          business_id: string
          created_at?: string
          event_type: string
          id?: string
          session_id: string
        }
        Update: {
          ad_id?: string | null
          business_id?: string
          created_at?: string
          event_type?: string
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_notes: {
        Row: {
          author_id: string
          business_id: string
          created_at: string
          id: string
          note: string
        }
        Insert: {
          author_id: string
          business_id: string
          created_at?: string
          id?: string
          note: string
        }
        Update: {
          author_id?: string
          business_id?: string
          created_at?: string
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_notes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address_en: string | null
          address_ur: string | null
          area_id: string | null
          assigned_to: string | null
          call_count: number
          category_id: string
          city_id: string
          claimed_at: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description_en: string | null
          description_ur: string | null
          email: string | null
          established_year: number | null
          facebook_url: string | null
          gallery_urls: string[]
          home_delivery: boolean
          id: string
          instagram_url: string | null
          is_featured: boolean
          is_open_24h: boolean
          is_verified: boolean
          landmark_en: string | null
          landmark_ur: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          meta_description_en: string | null
          meta_title_en: string | null
          name_en: string
          name_ur: string | null
          opening_hours: Json | null
          owner_id: string | null
          owner_name: string | null
          owner_photo_url: string | null
          phone_normalized: string | null
          phone_primary: string
          phone_secondary: string | null
          plan_code: string
          plan_expires_at: string | null
          published_at: string | null
          rating_avg: number | null
          rating_count: number
          rejection_reason: string | null
          services_en: string[]
          services_ur: string[]
          slug: string
          source: string | null
          status: string
          tags: string[]
          tiktok_url: string | null
          updated_at: string
          video_urls: string[]
          view_count: number
          website_url: string | null
          whatsapp: string | null
          whatsapp_count: number
          youtube_url: string | null
        }
        Insert: {
          address_en?: string | null
          address_ur?: string | null
          area_id?: string | null
          assigned_to?: string | null
          call_count?: number
          category_id: string
          city_id: string
          claimed_at?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_ur?: string | null
          email?: string | null
          established_year?: number | null
          facebook_url?: string | null
          gallery_urls?: string[]
          home_delivery?: boolean
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          is_open_24h?: boolean
          is_verified?: boolean
          landmark_en?: string | null
          landmark_ur?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          meta_description_en?: string | null
          meta_title_en?: string | null
          name_en: string
          name_ur?: string | null
          opening_hours?: Json | null
          owner_id?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          phone_normalized?: string | null
          phone_primary: string
          phone_secondary?: string | null
          plan_code?: string
          plan_expires_at?: string | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          rejection_reason?: string | null
          services_en?: string[]
          services_ur?: string[]
          slug: string
          source?: string | null
          status?: string
          tags?: string[]
          tiktok_url?: string | null
          updated_at?: string
          video_urls?: string[]
          view_count?: number
          website_url?: string | null
          whatsapp?: string | null
          whatsapp_count?: number
          youtube_url?: string | null
        }
        Update: {
          address_en?: string | null
          address_ur?: string | null
          area_id?: string | null
          assigned_to?: string | null
          call_count?: number
          category_id?: string
          city_id?: string
          claimed_at?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          description_en?: string | null
          description_ur?: string | null
          email?: string | null
          established_year?: number | null
          facebook_url?: string | null
          gallery_urls?: string[]
          home_delivery?: boolean
          id?: string
          instagram_url?: string | null
          is_featured?: boolean
          is_open_24h?: boolean
          is_verified?: boolean
          landmark_en?: string | null
          landmark_ur?: string | null
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          meta_description_en?: string | null
          meta_title_en?: string | null
          name_en?: string
          name_ur?: string | null
          opening_hours?: Json | null
          owner_id?: string | null
          owner_name?: string | null
          owner_photo_url?: string | null
          phone_normalized?: string | null
          phone_primary?: string
          phone_secondary?: string | null
          plan_code?: string
          plan_expires_at?: string | null
          published_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          rejection_reason?: string | null
          services_en?: string[]
          services_ur?: string[]
          slug?: string
          source?: string | null
          status?: string
          tags?: string[]
          tiktok_url?: string | null
          updated_at?: string
          video_urls?: string[]
          view_count?: number
          website_url?: string | null
          whatsapp?: string | null
          whatsapp_count?: number
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_plan_code_fkey"
            columns: ["plan_code"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["code"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          id: string
          is_active: boolean
          name_en: string
          name_ur: string
          parent_id: string | null
          slug: string
          sort_order: number
          synonyms: string[]
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_ur: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          synonyms?: string[]
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_ur?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          synonyms?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          center_lat: number | null
          center_lng: number | null
          created_at: string
          id: string
          is_active: boolean
          name_en: string
          name_ur: string
          slug: string
          updated_at: string
        }
        Insert: {
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_ur: string
          slug: string
          updated_at?: string
        }
        Update: {
          center_lat?: number | null
          center_lng?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_ur?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_business_stats: {
        Row: {
          business_id: string
          calls: number
          directions: number
          shares: number
          stat_date: string
          views: number
          whatsapp: number
        }
        Insert: {
          business_id: string
          calls?: number
          directions?: number
          shares?: number
          stat_date: string
          views?: number
          whatsapp?: number
        }
        Update: {
          business_id?: string
          calls?: number
          directions?: number
          shares?: number
          stat_date?: string
          views?: number
          whatsapp?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_business_stats_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_contacts: {
        Row: {
          category: string
          city_id: string
          created_at: string
          description_en: string | null
          description_ur: string | null
          icon: string
          id: string
          is_active: boolean
          name_en: string
          name_ur: string
          phone: string
          sort_order: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          category: string
          city_id: string
          created_at?: string
          description_en?: string | null
          description_ur?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name_en: string
          name_ur: string
          phone: string
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          category?: string
          city_id?: string
          created_at?: string
          description_en?: string | null
          description_ur?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name_en?: string
          name_ur?: string
          phone?: string
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_contacts_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          created_at: string
          created_by: string | null
          errors: Json
          failed_count: number
          filename: string
          id: string
          imported_count: number
          total_rows: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          failed_count?: number
          filename: string
          id?: string
          imported_count?: number
          total_rows: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          errors?: Json
          failed_count?: number
          filename?: string
          id?: string
          imported_count?: number
          total_rows?: number
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          business_id: string
          created_at: string
          handled_by: string | null
          id: string
          message: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          handled_by?: string | null
          id?: string
          message: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          area_text: string | null
          assigned_to: string | null
          category_text: string | null
          converted_business_id: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          phone: string
          phone_normalized: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          area_text?: string | null
          assigned_to?: string | null
          category_text?: string | null
          converted_business_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          phone: string
          phone_normalized?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          area_text?: string | null
          assigned_to?: string | null
          category_text?: string | null
          converted_business_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string
          phone_normalized?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_business_id_fkey"
            columns: ["converted_business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body_en: string
          body_ur: string
          created_at: string
          id: string
          is_read: boolean
          link_path: string | null
          title_en: string
          title_ur: string
          type: string
          user_id: string
        }
        Insert: {
          body_en: string
          body_ur: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_path?: string | null
          title_en: string
          title_ur: string
          type: string
          user_id: string
        }
        Update: {
          body_en?: string
          body_ur?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link_path?: string | null
          title_en?: string
          title_ur?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          status: string
          title: string
          updated_at: string
          valid_from: string
          valid_to: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          status?: string
          title: string
          updated_at?: string
          valid_from: string
          valid_to: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          body_md_en: string
          body_md_ur: string
          created_at: string
          id: string
          is_published: boolean
          slug: string
          title_en: string
          title_ur: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body_md_en?: string
          body_md_ur?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug: string
          title_en: string
          title_ur: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body_md_en?: string
          body_md_ur?: string
          created_at?: string
          id?: string
          is_published?: boolean
          slug?: string
          title_en?: string
          title_ur?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          code: string
          created_at: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name_en: string
          name_ur: string
          price_note: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name_en: string
          name_ur: string
          price_note?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name_en?: string
          name_ur?: string
          price_note?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          must_change_password: boolean
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          must_change_password?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          author_name: string
          business_id: string
          comment: string
          created_at: string
          id: string
          owner_reply: string | null
          owner_reply_at: string | null
          rating: number
          status: string
          updated_at: string
        }
        Insert: {
          author_name: string
          business_id: string
          comment: string
          created_at?: string
          id?: string
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating: number
          status?: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          business_id?: string
          comment?: string
          created_at?: string
          id?: string
          owner_reply?: string | null
          owner_reply_at?: string | null
          rating?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      search_logs: {
        Row: {
          created_at: string
          filters: Json
          id: string
          query: string
          results_count: number
        }
        Insert: {
          created_at?: string
          filters?: Json
          id?: string
          query: string
          results_count?: number
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          query?: string
          results_count?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          is_public: boolean
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          is_public?: boolean
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          description?: string | null
          is_public?: boolean
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          permissions: Json
          staff_types: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          staff_types?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json
          staff_types?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          admin_note: string | null
          assigned_to: string | null
          business_id: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          id: string
          payload: Json
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          assigned_to?: string | null
          business_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          assigned_to?: string | null
          business_id?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          payload?: Json
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_analytics: { Args: { p_days?: number }; Returns: Json }
      admin_dashboard_counts: { Args: never; Returns: Json }
      approve_submission: {
        Args: { p_action: string; p_submission_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      convert_lead: { Args: { p_lead_id: string }; Returns: string }
      effective_plan: { Args: { b_id: string }; Returns: string }
      expire_plans_and_offers: { Args: never; Returns: undefined }
      find_duplicate_businesses: {
        Args: { p_area_id?: string; p_name: string; p_phone_normalized: string }
        Returns: {
          address_en: string | null
          address_ur: string | null
          area_id: string | null
          assigned_to: string | null
          call_count: number
          category_id: string
          city_id: string
          claimed_at: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          description_en: string | null
          description_ur: string | null
          email: string | null
          established_year: number | null
          facebook_url: string | null
          gallery_urls: string[]
          home_delivery: boolean
          id: string
          instagram_url: string | null
          is_featured: boolean
          is_open_24h: boolean
          is_verified: boolean
          landmark_en: string | null
          landmark_ur: string | null
          lat: number | null
          lng: number | null
          logo_url: string | null
          meta_description_en: string | null
          meta_title_en: string | null
          name_en: string
          name_ur: string | null
          opening_hours: Json | null
          owner_id: string | null
          owner_name: string | null
          owner_photo_url: string | null
          phone_normalized: string | null
          phone_primary: string
          phone_secondary: string | null
          plan_code: string
          plan_expires_at: string | null
          published_at: string | null
          rating_avg: number | null
          rating_count: number
          rejection_reason: string | null
          services_en: string[]
          services_ur: string[]
          slug: string
          source: string | null
          status: string
          tags: string[]
          tiktok_url: string | null
          updated_at: string
          video_urls: string[]
          view_count: number
          website_url: string | null
          whatsapp: string | null
          whatsapp_count: number
          youtube_url: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_business_public: { Args: { p_slug: string }; Returns: Json }
      is_business_open_now: {
        Args: { p_hours: Json; p_open_24h: boolean }
        Returns: boolean
      }
      is_owner_of: { Args: { b_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      mark_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: undefined
      }
      my_permissions: { Args: never; Returns: Json }
      normalize_pk_phone: { Args: { p: string }; Returns: string }
      owner_dashboard_stats: {
        Args: { p_business_id: string; p_days?: number }
        Returns: Json
      }
      owner_reply_to_review: {
        Args: { p_reply: string; p_review_id: string }
        Returns: undefined
      }
      related_businesses: {
        Args: { p_business_id: string; p_limit?: number }
        Returns: Json[]
      }
      search_businesses: {
        Args: {
          p_area?: string
          p_category?: string
          p_delivery?: boolean
          p_has_offer?: boolean
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_min_rating?: number
          p_offset?: number
          p_open_now?: boolean
          p_query?: string
          p_sort?: string
          p_verified?: boolean
        }
        Returns: Json[]
      }
      search_suggestions: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          kind: string
          label_en: string
          label_ur: string
          slug: string
          subtitle: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      staff_has_permission: { Args: { perm: string }; Returns: boolean }
      unaccent: { Args: { "": string }; Returns: string }
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
