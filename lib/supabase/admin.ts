import "server-only";

import {
  createClient as createSupabaseClient,
} from "@supabase/supabase-js";

import { serverEnv } from "@/lib/env/server";

export function createAdminClient() {
  return createSupabaseClient(
    serverEnv.SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}