// TODO: Perbarui informasi publik melalui pengaturan acara tanpa memakai fixtures produksi.
import { hasSupabaseConfig, hasAppUrl } from "@/lib/supabase/env";
import { getPublicLoginData } from "@/controllers/auth/public-login";
import { isDemoMode } from "@/models/demo/mode";
import { DemoLogin } from "@/views/demo/login";
import { ConnectedLogin } from "@/views/connected/login";

export const dynamic = "force-dynamic";

/** Memilih adapter login demo atau Supabase dan membaca informasi publik acara. */
export default async function Page({
	searchParams,
}: {
	searchParams: Promise<{ auth?: string }>;
}) {
	if (isDemoMode()) return <DemoLogin />;
	const { auth } = await searchParams;
	const configured = hasSupabaseConfig();
	const { resources, dateLabel } = await getPublicLoginData(configured);
	const errors: Record<string, string> = {
		failed: "Login belum berhasil atau dibatalkan. Silakan coba lagi.",
		unconfigured: "Konfigurasi login belum tersedia.",
		"google-config":
			"Login Google belum dikonfigurasi pada deployment ini. Hubungi admin.",
		inactive: "Akun tidak aktif atau tidak memiliki akses. Hubungi admin.",
		profile: "Profil belum tersedia. Hubungi admin.",
		staff: "Login staf belum berhasil. Periksa kredensial dan akses akun.",
	};
	return (
		<ConnectedLogin
			configured={configured}
			googleConfigured={configured && hasAppUrl()}
			error={auth ? errors[auth] : undefined}
			resources={resources}
			dateLabel={dateLabel}
		/>
	);
}
