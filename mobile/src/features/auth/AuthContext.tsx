import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clearSession, getRefreshToken, initApi, setOnSignOut, setSession } from '../../lib/api';
import { authApi, usersApi } from '../../lib/endpoints';
import { SelfUser } from '../../lib/types';

interface AuthState {
  user: SelfUser | null;
  initializing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (displayName: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: SelfUser) => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SelfUser | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    setOnSignOut(() => setUser(null));
    return () => setOnSignOut(null);
  }, []);

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      const tokens = await initApi();
      if (tokens) {
        try {
          const me = await usersApi.me();
          if (active) setUser(me);
        } catch {
          await clearSession();
        }
      }
      if (active) setInitializing(false);
    };
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    await setSession(result);
    setUser(result.user);
  }, []);

  const signUp = useCallback(async (displayName: string, email: string, password: string) => {
    const result = await authApi.register({ displayName, email, password });
    await setSession(result);
    setUser(result.user);
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        await clearSession();
      }
    }
    await clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, initializing, signIn, signUp, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
