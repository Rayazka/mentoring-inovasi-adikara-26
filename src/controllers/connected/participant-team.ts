// TODO: Tambahkan pembacaan permintaan ketua saat issue pengelolaan anggota dihubungkan.
import "server-only";
import { requireSession } from "@/lib/auth/session";
import type { TeamPageData } from "@/models/connected/team";
import {
	readParticipantTeam,
	readTeamMembers,
	readOwnJoinRequests,
	searchPublicTeams,
} from "@/models/connected/team-repository";

/** Memuat tim peserta dengan sesi server dan hanya proyeksi publik untuk pencarian lintas tim. */
export async function loadParticipantTeam(
	input: unknown,
): Promise<TeamPageData> {
	const { supabase, user } = await requireSession(["participant"]);
	const query = typeof input === "string" ? input.trim().slice(0, 100) : "";
	const empty: TeamPageData = {
		userId: user.id,
		team: null,
		members: [],
		requests: [],
		publicTeams: [],
		query,
		error: false,
	};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		const [members, requests, publicTeams] = await Promise.all([
			team ? readTeamMembers(supabase, team.id) : Promise.resolve([]),
			readOwnJoinRequests(supabase, user.id),
			team ? Promise.resolve([]) : searchPublicTeams(supabase, query),
		]);
		return { ...empty, team, members, requests, publicTeams };
	} catch {
		return { ...empty, error: true };
	}
}
