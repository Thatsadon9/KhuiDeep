import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          accent: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          talk_modes: string[];
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          accent?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          talk_modes?: string[];
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          accent?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          talk_modes?: string[];
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          category_id: string;
          question: string;
          helper_text: string | null;
          level: number;
          tags: string[] | null;
          audience: string[];
          sensitivity: string[];
          requires_consent: boolean;
          default_pool: boolean;
          content_note: string | null;
          aftercare_level: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          talk_modes: string[];
        };
        Insert: {
          id?: string;
          category_id: string;
          question: string;
          helper_text?: string | null;
          level?: number;
          tags?: string[] | null;
          audience?: string[];
          sensitivity?: string[];
          requires_consent?: boolean;
          default_pool?: boolean;
          content_note?: string | null;
          aftercare_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          talk_modes?: string[];
        };
        Update: {
          id?: string;
          category_id?: string;
          question?: string;
          helper_text?: string | null;
          level?: number;
          tags?: string[] | null;
          audience?: string[];
          sensitivity?: string[];
          requires_consent?: boolean;
          default_pool?: boolean;
          content_note?: string | null;
          aftercare_level?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          talk_modes?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "questions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: {
          user_id: string;
          email: string;
          display_name: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email: string;
          display_name?: string | null;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string;
          display_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      analytics_events: {
        Row: {
          id: string;
          event_type: string;
          occurred_at: string;
          session_id: string | null;
          talk_mode: string | null;
          category_slug: string | null;
          question_id: string | null;
          depth: number | null;
          audience: string | null;
          room_id: string | null;
          page_path: string | null;
          metadata: Record<string, unknown>;
        };
        Insert: {
          id?: string;
          event_type: string;
          occurred_at?: string;
          session_id?: string | null;
          talk_mode?: string | null;
          category_slug?: string | null;
          question_id?: string | null;
          depth?: number | null;
          audience?: string | null;
          room_id?: string | null;
          page_path?: string | null;
          metadata?: Record<string, unknown>;
        };
        Update: {
          id?: string;
          event_type?: string;
          occurred_at?: string;
          session_id?: string | null;
          talk_mode?: string | null;
          category_slug?: string | null;
          question_id?: string | null;
          depth?: number | null;
          audience?: string | null;
          room_id?: string | null;
          page_path?: string | null;
          metadata?: Record<string, unknown>;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_question_id_fkey";
            columns: ["question_id"];
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let cachedClient: SupabaseClient<Database> | null = null;

export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return cachedClient;
}
