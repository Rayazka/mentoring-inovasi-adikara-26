// TODO: Pertahankan route review sebagai adapter tipis dengan validasi pada controller.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantSubmission } from "@/controllers/connected/participant-submission";
import { ConnectedSubmissionPage } from "@/views/connected/participant-submission";

/** Memuat review produksi atau alur demo tanpa mencampurkan sumber datanya. */
export default async function SubmissionPage({
	searchParams,
}: {
	searchParams: Promise<{ mentor?: string; slot?: string }>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	const { mentor, slot } = await searchParams;
	return (
		<ConnectedSubmissionPage
			data={await loadParticipantSubmission(mentor, slot)}
		/>
	);
}
