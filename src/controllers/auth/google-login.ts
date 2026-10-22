// TODO: Pertahankan penanganan kegagalan OAuth tanpa mencatat kode, token, atau cookie sesi.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl, hasAppUrl, hasSupabaseConfig } from "@/lib/supabase/env";

/** Menyiapkan tujuan OAuth atau mengembalikan kegagalan aman untuk ditampilkan adapter login. */
export async function beginGoogleLogin() {
	if (!hasSupabaseConfig() || !hasAppUrl()) {
		console.error("[auth] google_config_invalid");
		return "/?auth=google-config";
	}
	try {
		const supabase = await createClient();
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: new URL("/auth/callback", getAppUrl()).toString(),
				scopes: "openid email profile",
			},
		});
		if (!error && data?.url) return data.url;
	} catch {
		// Rincian exception dapat memuat data autentikasi; catat hanya tahap yang gagal.
		console.error("[auth] google_start_failed");
	}
	return "/?auth=failed";
}

/** Menukar kode Google dengan sesi dan mengembalikan hanya tujuan internal yang tetap. */
export async function completeGoogleLogin(code: string | null) {
	if (!hasSupabaseConfig() || !hasAppUrl()) {
		console.error("[auth] google_config_invalid");
		return "/?auth=google-config";
	}
	if (!code) return "/?auth=failed";
	try {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) return "/dashboard";
	} catch {
		// Jangan mencetak kode callback atau token ketika jaringan gagal.
		console.error("[auth] google_callback_failed");
	}
	return "/?auth=failed";
}
