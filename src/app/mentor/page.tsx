// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { requireSession } from "@/lib/auth/session";
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { Panel } from "@/views/components/ui";
import { staffDisplayName } from "@/models/connected/staff";

export const dynamic = "force-dynamic";

/** Menampilkan halaman awal mentor yang berhak. */
export default async function MentorPage() {
	if (isDemoMode()) return <DemoApplication />;
	const { profile } = await requireSession(["mentor_general"]);
	return (
		<Panel
			title={`Halo, ${staffDisplayName({ full_name: profile.full_name, role: "mentor_general" })}.`}
		>
			<p>Selamat datang di ruang mentoring ADIKARA 2026.</p>
		</Panel>
	);
}
