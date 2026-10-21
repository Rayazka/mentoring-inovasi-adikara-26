// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "./env";

/** Membuat client Supabase sesuai konteks browser atau server. */
export async function createClient() {
	const cookieStore = await cookies();
	const { url, key } = getSupabaseConfig();

	return createServerClient(url, key, {
		cookies: {
			/** Menjalankan langkah getAll sesuai tanggung jawab modul ini. */
			getAll() {
				return cookieStore.getAll();
			},
			/** Menjalankan langkah setAll sesuai tanggung jawab modul ini. */
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(
						/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
						({ name, value, options }) => {
							cookieStore.set(name, value, options);
						},
					);
				} catch {
					// Server Component tidak menulis cookie; penyegaran sesi ditangani proxy.ts.
				}
			},
		},
	});
}
