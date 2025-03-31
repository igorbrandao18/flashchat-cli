import { User } from '@supabase/supabase-js';

export interface Profile extends User {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export interface Session {
  user: Profile | null;
  error: Error | null;
}

export interface AuthError {
  message: string;
} 