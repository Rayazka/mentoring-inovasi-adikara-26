// TODO: Verifikasi kebijakan login staf setiap kali peran operasional berubah.
import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { canSignInAsStaff } from "@/lib/auth/roles";

const credentials = z.object({
	email: z.email().max(254),
	password: z.string().min(1).max(1024),
});
const denied = {
	error: "Login staf belum berhasil. Periksa email, password, dan akses akun.",
};

/** Memverifikasi password dan profil staf tanpa memercayai role dari form. */
export async function authenticateStaff(form: FormData) {
	const input = credentials.safeParse({
		email: String(form.get("email") ?? "").trim(),
		password: form.get("password"),
	});
	if (!input.success || !hasSupabaseConfig()) return denied;
	const supabase = await createClient();
	const { data, error } = await supabase.auth.signInWithPassword(input.data);
	if (error || !data.user) return denied;
	const { data: profile, error: profileError } = await supabase
		.from("profiles")
		.select("role,is_active")
		.eq("id", data.user.id)
		.single();
	if (profileError || !canSignInAsStaff(profile)) {
		await supabase.auth.signOut({ scope: "local" });
		return denied;
	}
	return { error: null };
}
