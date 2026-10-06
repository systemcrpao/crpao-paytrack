import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clearDikaCache } from './dikaStore';

const AUTH_STORAGE_KEY = 'dika-auth-v2';

const emptyAuthState = {
  user: null,
  isAuthenticated: false,
};

function clearAuthStorage() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem('dika-auth');
    localStorage.removeItem('dika-auth');
  } catch {
    /* ignore */
  }
}

export const useAuthStore = create(
  persist(
    (set) => ({
      ...emptyAuthState,
      login: (user) =>
        set({
          user: {
            username: user.username,
            name: user.name,
            role: user.role,
          },
          isAuthenticated: true,
        }),
      logout: () => {
        clearDikaCache();
        clearAuthStorage();
        set({ ...emptyAuthState });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

try {
  sessionStorage.removeItem('dika-auth');
  localStorage.removeItem('dika-auth');
} catch {
  /* ignore legacy keys */
}
