import { createContext, useContext, useEffect, useState } from 'react';
import { fetchSessionProfile } from '../services/api';
import { getSupabaseClient } from '../services/supabaseClient';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let ready = false;

    const markReady = () => {
      if (!cancelled && !ready) {
        ready = true;
        setAuthReady(true);
      }
    };

    let unsubscribe = () => {};

    void getSupabaseClient().then((supabase) => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (cancelled) return;

        // refresh token ไม่ต้องโหลด profile ซ้ำ — ลด request ไป Supabase
        if (event === 'TOKEN_REFRESHED') {
          markReady();
          return;
        }

        if (!session) {
          if (useAuthStore.getState().isAuthenticated) {
            logout();
          }
          markReady();
          return;
        }

        const alreadyLoggedIn = useAuthStore.getState().isAuthenticated;

        if (event === 'SIGNED_IN' && alreadyLoggedIn) {
          markReady();
          return;
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          try {
            const profile = await fetchSessionProfile();
            if (profile) {
              login(profile);
            } else if (alreadyLoggedIn) {
              logout();
            }
          } catch {
            if (useAuthStore.getState().isAuthenticated) {
              logout();
            }
          }
        }

        markReady();
      });

      unsubscribe = () => subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [login, logout]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, authReady }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
