import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { clearAuth, loadStoredAuth, storeAuth, type AuthMethod, type AuthUser } from '@/lib/auth-gate';

type Auth = {
  user: AuthUser | null;
  hydrated: boolean;
  signIn: (name: string, email: string, method?: AuthMethod) => void;
  signOut: () => void;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(loadStoredAuth());
    setHydrated(true);
  }, []);

  const value: Auth = {
    user,
    hydrated,
    signIn: (name, email, method = 'password') => {
      const next = { name, email, method };
      storeAuth(next);
      setUser(next);
    },
    signOut: () => {
      clearAuth();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('Auth provider is required');
  return context;
}
