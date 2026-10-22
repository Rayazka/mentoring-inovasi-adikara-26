// TODO: Batasi penggunaan client istimewa pada unggahan yang telah diotorisasi dengan sesi pengguna.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./env";

/** Membuat client server khusus Storage tanpa persistensi sesi dan tanpa mengekspor secret ke browser. */
export function createStorageAdmin() {
	const secret = process.env.SUPABASE_SECRET_KEY;
	if (!secret?.startsWith("sb_secret_"))
		throw new Error("Penyimpanan belum dikonfigurasi.");
	return createClient(getSupabaseConfig().url, secret, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});
}
