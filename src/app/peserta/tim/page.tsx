// TODO: Pertahankan adapter route tipis saat fitur tim diperluas.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantTeam } from "@/controllers/connected/participant-team";
import { ConnectedTeamPage } from "@/views/connected/participant-team";

/** Memilih halaman tim produksi atau demo tanpa mencampurkan sumber datanya. */
export default async function TeamPage({
	searchParams,
}: {
	searchParams: Promise<{ q?: string; tab?: string }>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	const { q, tab } = await searchParams;
	return <ConnectedTeamPage data={await loadParticipantTeam(q, tab)} />;
}
