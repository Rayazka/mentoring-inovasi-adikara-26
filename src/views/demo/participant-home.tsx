// TODO: Pertahankan adapter demo tipis dan struktur Home V2 pada komponen presentasi bersama.
"use client";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { participantHomeData } from "@/controllers/demo/home-controller";
import { ParticipantHomeView } from "@/views/components/participant-home";
import { registerDemoView } from "./registry";

/** Mengadaptasi data demo ke kontrak tampilan Home tanpa mengubah alur produksi. */
export function ParticipantHome({
	controller,
	pathname,
}: {
	controller: DemoController;
	pathname: string;
}) {
	const { state, actor } = controller;
	if (!state || !actor || pathname !== "/peserta") return null;
	const data = participantHomeData(state, actor);
	const preview = state.mentors
		.filter(
			/** Memilih profil demo aktif untuk pratinjau katalog. */
			function activeMentor(item) {
				return item.active && !item.archived;
			},
		)
		.slice(0, 3);
	return (
		<ParticipantHomeView
			data={{
				...data,
				team: data.team ?? null,
				work: data.work ?? null,
				request: data.request ?? null,
				slot: data.slot ?? null,
				mentor: data.mentor ?? null,
				actor,
				settings: state.settings,
				users: state.users,
				resources: state.resources,
				preview,
			}}
		/>
	);
}
registerDemoView("/peserta", ParticipantHome);
