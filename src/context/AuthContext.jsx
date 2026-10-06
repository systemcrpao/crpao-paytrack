import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const [authReady, setAuthReady] = useState(() =>
    useAuthStore.persist.hasHydrated(),
  );

  useEffect(() => {
    const finishHydration = () => {
      setAuthReady(true);
    };

    const unsubHydration = useAuthStore.persist.onFinishHydration(finishHydration);

    if (!useAuthStore.persist.hasHydrated()) {
      void useAuthStore.persist.rehydrate();
    } else {
      finishHydration();
    }

    return () => {
      unsubHydration();
    };
  }, []);

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
