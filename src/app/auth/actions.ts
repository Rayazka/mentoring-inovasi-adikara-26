// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
"use server";

import { authenticateStaff } from "@/controllers/auth/staff-login";
import { beginGoogleLogin } from "@/controllers/auth/google-login";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Memulai autentikasi Google melalui layanan Supabase. */
export async function signInWithGoogle() {
	redirect(await beginGoogleLogin());
}

/** Mengakhiri sesi Supabase dan kembali ke halaman publik. */
export async function signOut() {
	const supabase = await createClient();
	const { error } = await supabase.auth.signOut();
	if (error) throw new Error("Tidak dapat keluar. Silakan coba lagi.");
	redirect("/");
}

/** Memproses form staf dan meneruskan routing pada guard profil server. */
export async function signInStaff(
	_previous: { error: string | null },
	form: FormData,
): Promise<{ error: string | null }> {
	const result = await authenticateStaff(form);
	if (result.error) return result;
	redirect("/dashboard");
}
