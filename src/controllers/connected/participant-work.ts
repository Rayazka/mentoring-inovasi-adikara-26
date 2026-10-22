// TODO: Pertahankan hak edit karya berdasarkan keanggotaan aktif saat permintaan diproses.
import "server-only";
import { requireSession } from "@/lib/auth/session";
import type { ParticipantTeam } from "@/models/connected/team";
import type { WorkRecord } from "@/models/connected/work";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { readTeamWork } from "@/models/connected/work-repository";
import { readWorkDocuments } from "@/models/connected/document-repository";
import type { TeamDocument } from "@/models/connected/document";

/** Memuat karya milik tim aktif tanpa menerima identitas tim dari URL pengguna. */
export async function loadParticipantWork(): Promise<{
	team: ParticipantTeam | null;
	work: WorkRecord | null;
	documents: TeamDocument[];
	userId: string;
	error: boolean;
}> {
	const { supabase, user } = await requireSession(["participant"]);
	try {
		const team = await readParticipantTeam(supabase, user.id);
		const [work, documents] = await Promise.all([
			team ? readTeamWork(supabase, team.id) : null,
			team ? readWorkDocuments(supabase, team.id) : [],
		]);
		return {
			team,
			work,
			documents,
			userId: user.id,
			error: false,
		};
	} catch {
		return {
			team: null,
			work: null,
			documents: [],
			userId: user.id,
			error: true,
		};
	}
}
