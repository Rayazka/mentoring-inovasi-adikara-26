// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { requireSession } from "@/lib/auth/session";
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { Panel } from "@/views/components/ui";
import { staffDisplayName } from "@/models/connected/staff";

export const dynamic = "force-dynamic";

/** Menampilkan halaman awal administrator yang berhak. */
export default async function AdminPage() {
	if (isDemoMode()) return <DemoApplication />;
	const { profile } = await requireSession(["admin"]);
	return (
		<Panel
			title={`Halo, ${staffDisplayName({ full_name: profile.full_name, role: "admin" })}.`}
		>
			<p>Selamat datang di ruang mentoring ADIKARA 2026.</p>
		</Panel>
	);
}
