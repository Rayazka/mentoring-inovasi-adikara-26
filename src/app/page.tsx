// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { signInWithGoogle } from "./auth/actions";
import { hasSupabaseConfig } from "@/lib/supabase/env";

// Halaman autentikasi dasar sebelum tampilan demo menggantikannya.
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ auth?: string }>;
}) {
	const { auth } = await searchParams;
	const configured = hasSupabaseConfig();
	return (
		<main>
			<h1>Mentoring ADIKARA 2026</h1>
			<p>24–25 Oktober 2026 · 18.30–22.00 WIB</p>
			<p>Kembangkan karyamu bersama mentor di bidangnya.</p>
			{!configured || auth === "unconfigured" ? (
				<p role="status">Pendaftaran sesi melalui aplikasi belum tersedia.</p>
			) : (
				<form action={signInWithGoogle}>
					<button type="submit">Masuk dengan Google</button>
				</form>
			)}
			{auth === "failed" && (
				<p role="alert">Login belum berhasil. Silakan coba lagi.</p>
			)}
		</main>
	);
}
