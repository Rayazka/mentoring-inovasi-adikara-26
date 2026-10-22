// TODO: Pertahankan filter URL saat katalog bertambah besar.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantCatalog } from "@/controllers/connected/participant-mentor";
import { ConnectedMentorCatalog } from "@/views/connected/participant-catalog";

/** Mengadaptasi permintaan katalog ke controller produksi atau demo yang terpisah. */
export default async function CatalogPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	return (
		<ConnectedMentorCatalog
			data={await loadParticipantCatalog(await searchParams)}
		/>
	);
}
