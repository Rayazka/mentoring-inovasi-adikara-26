// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { z } from "zod";

const publicConfig = z.object({
	url: z.url(),
	key: z.string().min(1),
});

/** Memeriksa kelengkapan konfigurasi publik Supabase. */
export function hasSupabaseConfig() {
	return publicConfig.safeParse({
		url: process.env.NEXT_PUBLIC_SUPABASE_URL,
		key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	}).success;
}

/** Mengambil konfigurasi Supabase yang telah divalidasi. */
export function getSupabaseConfig() {
	const result = publicConfig.safeParse({
		url: process.env.NEXT_PUBLIC_SUPABASE_URL,
		key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	});
	if (!result.success) {
		throw new Error(
			"Konfigurasi Supabase belum tersedia. Isi .env.local mengikuti .env.example.",
		);
	}
	return result.data;
}
