import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AuthUser = { name: string; email: string };

type Auth = {
  user: AuthUser | null;
  hydrated: boolean;
  signOut: () => Promise<void>;
};

function userFromSession(session: Session | null): AuthUser | null {
  const current = session?.user;
  if (!current?.email) return null;
  const meta = (current.user_metadata ?? {}) as Record<string, unknown>;
  const named =
    (typeof meta.name === 'string' && meta.name.trim()) ||
    (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
    current.email.split('@')[0] ||
    'Creator';
  return { name: named, email: current.email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setUser(userFromSession(data.session));
      setHydrated(true);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT' && event !== 'USER_UPDATED') return;
      setUser(userFromSession(session));
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        signOut: async () => {
          await supabase.auth.signOut();
          setUser(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

const AuthContext = createContext<Auth | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Auth provider is required');
  return context;
}
