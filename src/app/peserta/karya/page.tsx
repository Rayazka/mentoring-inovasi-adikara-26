// TODO: Pertahankan adapter tipis ketika bahan karya dihubungkan ke Storage privat.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantWork } from "@/controllers/connected/participant-work";
import { ConnectedWorkPage } from "@/views/connected/participant-work";

/** Memilih identitas karya produksi tanpa menyentuh fixtures mode demo. */
export default async function WorkPage() {
	if (isDemoMode()) return <DemoApplication />;
	return <ConnectedWorkPage data={await loadParticipantWork()} />;
}
