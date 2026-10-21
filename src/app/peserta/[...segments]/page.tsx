// TODO: Pertahankan pemeriksaan sesi server ketika fitur produksi dihubungkan.
import { notFound } from "next/navigation";
import { isDemoMode } from "@/models/demo/mode";
import { requireSession } from "@/lib/auth/session";
import { DemoApplication } from "@/views/demo/application";

/** Menyajikan halaman fitur peserta tanpa mencampur aturan domain dengan adapter route. */
export default async function FeaturePage() {
	if (!isDemoMode()) {
		await requireSession(["participant"]);
		notFound();
	}
	return <DemoApplication />;
}
