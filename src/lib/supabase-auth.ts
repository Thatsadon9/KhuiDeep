"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase";

let cachedAuthClient: SupabaseClient<Database> | null = null;

export function getSupabaseAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!cachedAuthClient) {
    cachedAuthClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "khui-deep-admin-auth",
      },
    });
  }

  return cachedAuthClient;
}

export async function signOutAdmin() {
  const supabase = getSupabaseAuthClient();
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

export async function verifyAdminAccess(userId: string) {
  const supabase = getSupabaseAuthClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return !error && Boolean(data);
}
