// TODO: Pertahankan pemeriksaan kepemilikan tim pada controller detail pengajuan.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantRequest } from "@/controllers/connected/participant-requests";
import { ConnectedRequestDetail } from "@/views/connected/participant-request-detail";

/** Memuat detail pengajuan hanya untuk anggota tim aktif yang sah. */
export default async function RequestPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	const { id } = await params;
	return <ConnectedRequestDetail data={await loadParticipantRequest(id)} />;
}
