"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function signInWithGoogle() {
  if (!hasSupabaseConfig()) redirect("/?auth=unconfigured");
  const appUrl = process.env.APP_URL;
  if (!appUrl) throw new Error("APP_URL belum dikonfigurasi.");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("/auth/callback", appUrl).toString(),
      scopes: "openid email profile",
    },
  });
  if (error || !data.url) redirect("/?auth=failed");
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Tidak dapat keluar. Silakan coba lagi.");
  redirect("/");
}
