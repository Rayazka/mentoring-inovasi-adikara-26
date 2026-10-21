// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/env";

/** Menyegarkan sesi server sebelum halaman privat diproses. */
export async function proxy(request: NextRequest) {
	if (!hasSupabaseConfig()) return NextResponse.next({ request });

	let response = NextResponse.next({ request });
	const { url, key } = getSupabaseConfig();
	const supabase = createServerClient(url, key, {
		cookies: {
			getAll /** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */:
				() => request.cookies.getAll(),
			/** Menjalankan langkah setAll sesuai tanggung jawab modul ini. */
			setAll(cookiesToSet) {
				cookiesToSet.forEach(
					/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
					({ name, value }) => {
						request.cookies.set(name, value);
					},
				);
				response = NextResponse.next({ request });
				cookiesToSet.forEach(
					/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
					({ name, value, options }) => {
						response.cookies.set(name, value, options);
					},
				);
			},
		},
	});

	// Segarkan sesi di sini; halaman privat tetap memverifikasi pengguna secara terpisah.
	await supabase.auth.getClaims();
	response.headers.set("Cache-Control", "private, no-store");
	return response;
}

export const config = {
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
