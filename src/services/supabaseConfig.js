const CONFIG_HINT =
  'ตั้งค่า VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ใน .env.local หรือ public/config.json แล้ว deploy ใหม่';

let cachedConfig = null;
let resolveInFlight = null;

function readEnvConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
  return { url, anonKey };
}

async function readPublicConfig() {
  const configPath = `${import.meta.env.BASE_URL}config.json`;
  const response = await fetch(configPath, { cache: 'no-store' });

  if (!response.ok) {
    return { url: '', anonKey: '' };
  }

  const data = await response.json();
  return {
    url: String(data?.supabaseUrl || '').trim(),
    anonKey: String(data?.supabaseAnonKey || '').trim(),
  };
}

export function isValidSupabaseUrl(url) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(url || '').trim());
}

export async function resolveSupabaseConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (resolveInFlight) {
    return resolveInFlight;
  }

  resolveInFlight = (async () => {
    const env = readEnvConfig();
    if (isValidSupabaseUrl(env.url) && env.anonKey) {
      cachedConfig = env;
      return cachedConfig;
    }

    const file = await readPublicConfig();
    if (isValidSupabaseUrl(file.url) && file.anonKey) {
      cachedConfig = file;
      return cachedConfig;
    }

    throw new Error(`ยังไม่ได้ตั้งค่า Supabase — ${CONFIG_HINT}`);
  })().finally(() => {
    resolveInFlight = null;
  });

  return resolveInFlight;
}

export function resetSupabaseConfigCache() {
  cachedConfig = null;
}
