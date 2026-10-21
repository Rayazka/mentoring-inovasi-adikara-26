import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { isUserRole, roleHome, type UserRole } from "./roles";

export async function requireSession(allowedRoles?: readonly UserRole[]) {
  if (!hasSupabaseConfig()) redirect("/?auth=unconfigured");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .eq("id", user.id)
    .single();

  if (error || !profile || !isUserRole(profile.role)) {
    throw new Error("Profil pengguna belum siap. Periksa migrasi database dan trigger profil.");
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) redirect(roleHome(profile.role));
  return { supabase, user, profile };
}
