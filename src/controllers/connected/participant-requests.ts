// TODO: Pertahankan batas tim aktif pada daftar, detail, dan tindakan pengajuan peserta.
import "server-only";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { parseParticipantRequestFilters } from "@/models/connected/request";
import {
	readTeamRequestCounts,
	readParticipantRequests,
	readParticipantRequest,
	readRequestDocumentSnapshots,
	readRequestEvents,
} from "@/models/connected/request-repository";

/** Memuat daftar dan statistik hanya untuk tim peserta yang masih aktif. */
export async function loadParticipantRequests(input: Record<string, unknown>) {
	const { supabase, user } = await requireSession(["participant"]);
	const filters = parseParticipantRequestFilters(input);
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { kind: "no-team" as const };
		const [list, counts] = await Promise.all([
			readParticipantRequests(supabase, team.id, filters),
			readTeamRequestCounts(supabase, team.id),
		]);
		return { kind: "ready" as const, team, filters, ...list, counts };
	} catch {
		return { kind: "error" as const };
	}
}
/** Memuat snapshot serta riwayat sesudah memastikan ID pengajuan adalah milik tim aktif. */
export async function loadParticipantRequest(id: string) {
	const { supabase, user } = await requireSession(["participant"]);
	if (!z.uuid().safeParse(id).success) return { kind: "not-found" as const };
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { kind: "not-found" as const };
		const request = await readParticipantRequest(supabase, team.id, id);
		if (!request) return { kind: "not-found" as const };
		const [documents, events] = await Promise.all([
			readRequestDocumentSnapshots(supabase, id),
			readRequestEvents(supabase, id),
		]);
		return {
			kind: "ready" as const,
			request,
			documents,
			events,
			leader: team.leader_id === user.id,
		};
	} catch {
		return { kind: "error" as const };
	}
}
