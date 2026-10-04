import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clearDikaCache } from './dikaStore';

export function getTodaySessionKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
  }).format(new Date());
}

export function isSessionValid(sessionDay) {
  if (!sessionDay) return false;
  return sessionDay === getTodaySessionKey();
}

const emptyAuthState = {
  user: null,
  isAuthenticated: false,
  sessionDay: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...emptyAuthState,
      login: (user) =>
        set({
          user: {
            username: user.username,
            name: user.name,
            role: user.role,
          },
          isAuthenticated: true,
          sessionDay: getTodaySessionKey(),
        }),
      logout: () => {
        clearDikaCache();
        set({ ...emptyAuthState });
      },
      clearExpiredSession: () => {
        const { sessionDay } = get();
        if (isSessionValid(sessionDay)) return;
        clearDikaCache();
        set({ ...emptyAuthState });
      },
    }),
    {
      name: 'dika-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionDay: state.sessionDay,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state || !isSessionValid(state.sessionDay)) {
          clearDikaCache();
          useAuthStore.setState({ ...emptyAuthState });
        }
      },
    },
  ),
);

try {
  localStorage.removeItem('dika-auth');
} catch {
  /* ignore */
}
