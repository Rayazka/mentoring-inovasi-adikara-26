// TODO: Pertahankan parameter route tervalidasi oleh controller profil mentor.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadParticipantMentor } from "@/controllers/connected/participant-mentor";
import { ConnectedMentorDetail } from "@/views/connected/participant-mentor";

/** Menyajikan profil mentor dan jadwal dengan snapshot waktu server yang konsisten. */
export default async function MentorPage({
	params,
	searchParams,
}: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ date?: string }>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	const { id } = await params;
	const { date } = await searchParams;
	const data = await loadParticipantMentor(id, date);
	return <ConnectedMentorDetail key={data.date} data={data} now={Date.now()} />;
}
