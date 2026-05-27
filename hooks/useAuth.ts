'use client';

import { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  id: string;
  email?: string;
  username?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser(id: string, email?: string) {
    // Try to get username from profiles table
    try {
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', id)
        .single();
      setUser({ id, email, username: data?.username });
    } catch {
      setUser({ id, email });
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return createElement(AuthContext.Provider, { value: { user, loading, signOut } }, children);
}

export function useAuth() {
  return useContext(AuthContext);
}
