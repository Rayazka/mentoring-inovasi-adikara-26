// TODO: Pertahankan adapter daftar pengajuan tipis dan seluruh filter tervalidasi di controller.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantRequests } from "@/controllers/connected/participant-requests";
import { ConnectedRequestsPage } from "@/views/connected/participant-requests";

/** Menampilkan daftar produksi dengan sumber data terpisah dari mode demo. */
export default async function RequestsPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, unknown>>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	return (
		<ConnectedRequestsPage
			data={await loadParticipantRequests(await searchParams)}
		/>
	);
}
