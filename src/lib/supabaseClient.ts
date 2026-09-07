import { createClient, SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_URL = 'https://ldxkemqwmekrdzatjxlr.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_y6ywwjj1fuRgP83lJVyHJg_Qo7Q3Vyx';

export function getSupabaseConfig() {
  const url = (typeof window !== 'undefined' ? localStorage.getItem('supabaseUrl') : null)
    || ((import.meta as any).env?.VITE_SUPABASE_URL) 
    || DEFAULT_URL;
  const key = (typeof window !== 'undefined' ? localStorage.getItem('supabaseAnonKey') : null)
    || ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY) 
    || DEFAULT_ANON_KEY;
  return { url: url.trim(), key: key.trim() };
}

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient {
  const { url, key } = getSupabaseConfig();
  if (!cachedClient || url !== cachedUrl || key !== cachedKey) {
    cachedUrl = url;
    cachedKey = key;
    cachedClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return cachedClient;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop: keyof SupabaseClient) {
    const client = getSupabaseClient();
    const val = client[prop];
    if (typeof val === 'function') {
      return (val as Function).bind(client);
    }
    return val;
  }
});

