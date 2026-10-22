// TODO: Pertahankan hak edit karya berdasarkan keanggotaan aktif saat permintaan diproses.
import "server-only";
import { requireSession } from "@/lib/auth/session";
import type { ParticipantTeam } from "@/models/connected/team";
import type { WorkRecord } from "@/models/connected/work";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { readTeamWork } from "@/models/connected/work-repository";

/** Memuat karya milik tim aktif tanpa menerima identitas tim dari URL pengguna. */
export async function loadParticipantWork(): Promise<{
	team: ParticipantTeam | null;
	work: WorkRecord | null;
	error: boolean;
}> {
	const { supabase, user } = await requireSession(["participant"]);
	try {
		const team = await readParticipantTeam(supabase, user.id);
		return {
			team,
			work: team ? await readTeamWork(supabase, team.id) : null,
			error: false,
		};
	} catch {
		return { team: null, work: null, error: true };
	}
}
