// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, getAppUrl } from "@/lib/supabase/env";

/** Memulai autentikasi Google melalui layanan Supabase. */
export async function signInWithGoogle() {
	if (!hasSupabaseConfig()) redirect("/?auth=unconfigured");
	const appUrl = getAppUrl();
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

/** Mengakhiri sesi Supabase dan kembali ke halaman publik. */
export async function signOut() {
	const supabase = await createClient();
	const { error } = await supabase.auth.signOut();
	if (error) throw new Error("Tidak dapat keluar. Silakan coba lagi.");
	redirect("/");
}
