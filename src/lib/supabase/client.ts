// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./env";

/** Membuat client Supabase sesuai konteks browser atau server. */
export function createClient() {
	const { url, key } = getSupabaseConfig();
	return createBrowserClient(url, key);
}
