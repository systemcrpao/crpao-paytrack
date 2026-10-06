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

    async function bootstrapAuth() {
      try {
        const supabase = await getSupabaseClient();
        const profile = await fetchSessionProfile();

        if (cancelled) return;

        if (profile) {
          login(profile);
        } else if (useAuthStore.getState().isAuthenticated) {
          logout();
        }
      } catch {
        if (!cancelled && useAuthStore.getState().isAuthenticated) {
          logout();
        }
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    }

    void bootstrapAuth();

    let unsubscribe = () => {};

    void getSupabaseClient().then((supabase) => {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (cancelled) return;

        if (!session) {
          if (useAuthStore.getState().isAuthenticated) {
            logout();
          }
          return;
        }

        void fetchSessionProfile()
          .then((profile) => {
            if (profile) login(profile);
          })
          .catch(() => {
            logout();
          });
      });

      unsubscribe = () => data.subscription.unsubscribe();
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
