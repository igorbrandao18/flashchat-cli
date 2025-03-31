import { useEffect, useState } from 'react';
import { Session, AuthError, User } from '@supabase/supabase-js';
import { supabase } from '@/config/supabase';

interface AuthResponse {
  data: { user: User | null; session: Session | null } | null;
  error: AuthError | null;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      console.log('Attempting login with:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Login response:', data, error);
      if (error) throw error;

      // Update session immediately after successful login
      if (data.session) {
        setSession(data.session);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error: error as AuthError };
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  return {
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}

export default useAuth;