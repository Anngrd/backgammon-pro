import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          city: string | null;
          games_played: number;
          games_won: number;
          average_ai_score: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      game_history: {
        Row: {
          id: string;
          player_id: string;
          opponent_name: string;
          result: 'win' | 'loss';
          ai_coach_score: string | null;
          mode: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['game_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['game_history']['Insert']>;
      };
    };
  };
};
