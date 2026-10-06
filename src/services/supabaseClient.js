import { createClient } from '@supabase/supabase-js';
import { resolveSupabaseConfig } from './supabaseConfig';

let client = null;
let clientPromise = null;

export function usernameToAuthEmail(username) {
  const normalized = String(username || '').trim().toLowerCase();
  return `${normalized}@paytrack.crpao.app`;
}

export async function getSupabaseClient() {
  if (client) {
    return client;
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const { url, anonKey } = await resolveSupabaseConfig();
      client = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return client;
    })();
  }

  return clientPromise;
}
