import { create } from 'zustand';
import { getBootstrap } from '../services/api';

const STALE_MS = 60_000;

function extractItems(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
}

async function fetchBootstrapPayload() {
  const result = await getBootstrap();
  return {
    items: extractItems(result),
    users: Array.isArray(result.users) ? result.users : [],
  };
}

export const useDikaStore = create((set, get) => ({
  items: [],
  users: [],
  loadedAt: 0,
  loading: false,
  error: '',

  loadBootstrap: async ({ force = false } = {}) => {
    const { loadedAt, items, users } = get();
    const hasCache = loadedAt > 0;
    const isFresh = Date.now() - loadedAt < STALE_MS;

    if (!force && hasCache && isFresh) {
      return { items, users };
    }

    if (!force && hasCache) {
      void get().revalidateBootstrap();
      return { items, users };
    }

    return get().revalidateBootstrap({ blocking: true });
  },

  revalidateBootstrap: async ({ blocking = false } = {}) => {
    if (blocking) {
      set({ loading: true, error: '' });
    }

    try {
      const payload = await fetchBootstrapPayload();
      set({
        items: payload.items,
        users: payload.users,
        loadedAt: Date.now(),
        loading: false,
        error: '',
      });
      return payload;
    } catch (err) {
      const message = err.message || 'ไม่สามารถโหลดข้อมูลได้';
      const hasCache = get().loadedAt > 0;

      if (blocking || !hasCache) {
        set({ loading: false, error: message });
        throw err;
      }

      set({ loading: false });
      return { items: get().items, users: get().users };
    }
  },

  invalidate: () => set({ loadedAt: 0 }),
}));

export function clearDikaCache() {
  useDikaStore.setState({
    items: [],
    users: [],
    loadedAt: 0,
    loading: false,
    error: '',
  });
}
