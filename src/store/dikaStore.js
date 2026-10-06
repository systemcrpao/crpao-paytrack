import { create } from 'zustand';
import { getBootstrap } from '../services/api';

const STALE_MS = 90_000;
const SESSION_CACHE_KEY = 'crpao_paytrack_bootstrap_v1';
const SESSION_CACHE_MAX_AGE_MS = 10 * 60_000;

let bootstrapInFlight = null;

function extractItems(result) {
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result)) return result;
  return [];
}

function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > SESSION_CACHE_MAX_AGE_MS) {
      return null;
    }

    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      users: Array.isArray(parsed.users) ? parsed.users : [],
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function writeSessionCache(items, users) {
  try {
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify({
        items,
        users,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // quota / private mode
  }
}

async function fetchBootstrapPayload() {
  if (bootstrapInFlight) {
    return bootstrapInFlight;
  }

  bootstrapInFlight = getBootstrap()
    .then((result) => ({
      items: extractItems(result),
      users: Array.isArray(result.users) ? result.users : [],
    }))
    .finally(() => {
      bootstrapInFlight = null;
    });

  return bootstrapInFlight;
}

function hydrateFromSessionIfNeeded(set, get) {
  if (get().loadedAt > 0) return;

  const session = readSessionCache();
  if (!session) return;

  set({
    items: session.items,
    users: session.users,
    loadedAt: session.savedAt,
    loading: false,
    error: '',
  });
}

export const useDikaStore = create((set, get) => ({
  items: [],
  users: [],
  loadedAt: 0,
  loading: false,
  refreshing: false,
  error: '',

  loadBootstrap: async ({ force = false } = {}) => {
    if (!force) {
      hydrateFromSessionIfNeeded(set, get);
    }

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
    const hasItems = get().items.length > 0;

    if (blocking && !hasItems) {
      set({ loading: true, error: '' });
    } else if (hasItems) {
      set({ refreshing: true, error: '' });
    }

    try {
      const payload = await fetchBootstrapPayload();
      const loadedAt = Date.now();

      set({
        items: payload.items,
        users: payload.users,
        loadedAt,
        loading: false,
        refreshing: false,
        error: '',
      });

      writeSessionCache(payload.items, payload.users);
      return payload;
    } catch (err) {
      const message = err.message || 'ไม่สามารถโหลดข้อมูลได้';
      const hasCache = get().loadedAt > 0;

      if (blocking && !hasCache) {
        set({ loading: false, refreshing: false, error: message });
        throw err;
      }

      set({ loading: false, refreshing: false });
      return { items: get().items, users: get().users };
    }
  },

  invalidate: () => set({ loadedAt: 0 }),
}));

export function clearDikaCache() {
  try {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
  } catch {
    // ignore
  }

  useDikaStore.setState({
    items: [],
    users: [],
    loadedAt: 0,
    loading: false,
    refreshing: false,
    error: '',
  });
}
