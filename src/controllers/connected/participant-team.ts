// TODO: Pertahankan pemisahan permintaan pribadi dan permintaan yang hanya dapat ditinjau ketua.
import "server-only";
import { requireSession } from "@/lib/auth/session";
import type { TeamPageData } from "@/models/connected/team";
import {
	readParticipantTeam,
	readTeamMembers,
	readOwnJoinRequests,
	searchPublicTeams,
	readIncomingJoins,
} from "@/models/connected/team-repository";

/** Memuat tim peserta dengan sesi server dan hanya proyeksi publik untuk pencarian lintas tim. */
export async function loadParticipantTeam(
	input: unknown,
	requestedTab?: unknown,
): Promise<TeamPageData> {
	const { supabase, user } = await requireSession(["participant"]);
	const query = typeof input === "string" ? input.trim().slice(0, 100) : "";
	const empty: TeamPageData = {
		userId: user.id,
		team: null,
		members: [],
		requests: [],
		incoming: [],
		tab:
			requestedTab === "members" || requestedTab === "requests"
				? requestedTab
				: "summary",
		publicTeams: [],
		query,
		error: false,
	};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		const [members, requests, publicTeams, incoming] = await Promise.all([
			team ? readTeamMembers(supabase, team.id) : Promise.resolve([]),
			readOwnJoinRequests(supabase, user.id),
			team ? Promise.resolve([]) : searchPublicTeams(supabase, query),
			team?.leader_id === user.id
				? readIncomingJoins(supabase, team.id)
				: Promise.resolve([]),
		]);
		return {
			...empty,
			team,
			members,
			requests,
			publicTeams,
			incoming,
			tab:
				requestedTab === "requests" && team?.leader_id !== user.id
					? "summary"
					: empty.tab,
		};
	} catch {
		return { ...empty, error: true };
	}
}
