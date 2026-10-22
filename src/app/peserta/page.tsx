// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantHome } from "@/controllers/connected/participant-home";
import { ConnectedParticipantHome } from "@/views/connected/participant-home";

export const dynamic = "force-dynamic";

/** Menampilkan halaman awal peserta yang berhak. */
export default async function ParticipantPage() {
	if (isDemoMode()) return <DemoApplication />;
	return <ConnectedParticipantHome result={await loadParticipantHome()} />;
}
