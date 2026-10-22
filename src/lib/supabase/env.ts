// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { z } from "zod";

/** Menolak alamat REST dan skema selain HTTPS untuk project hosted. */
function isRootHttpsUrl(value: string) {
	const url = new URL(value);
	return (
		url.protocol === "https:" &&
		url.pathname === "/" &&
		!url.search &&
		!url.hash &&
		!url.username &&
		!url.password
	);
}

const publicConfig = z.object({
	url: z.url().refine(isRootHttpsUrl),
	key: z.string().startsWith("sb_publishable_"),
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

/** Memvalidasi origin aplikasi tanpa menerima tujuan dari input pengguna. */
export function getAppUrl() {
	const value = process.env.APP_URL;
	if (!value) throw new Error("APP_URL belum dikonfigurasi.");
	const url = new URL(value);
	const local = ["localhost", "127.0.0.1"].includes(url.hostname);
	if (
		(url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
		url.pathname !== "/" ||
		url.search ||
		url.hash ||
		url.username ||
		url.password
	) {
		throw new Error(
			"APP_URL harus berupa origin HTTPS atau localhost untuk pengembangan.",
		);
	}
	return url.origin;
}
