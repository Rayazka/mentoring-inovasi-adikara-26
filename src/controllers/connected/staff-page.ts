// TODO: Tambahkan tindakan operasional melalui controller terotorisasi saat issue mutasi dituntaskan.
import "server-only";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import type { StaffRole } from "@/models/connected/staff";
import {
	parsePageFilters,
	type OperationalRequest,
	type MentorRecord,
	type ScheduleRecord,
	type TeamRecord,
	type AuditEntry,
	type DocumentRecord,
	type PageFilters,
} from "@/models/connected/operations";
import {
	readRequests,
	readRequest,
	readMentors,
	readSchedules,
	readTeams,
	readTeamDocuments,
	readAudit,
} from "@/models/connected/operations-repository";
export type StaffPageData = { role: StaffRole; filters: PageFilters } & (
	| { kind: "requests"; items: OperationalRequest[]; total: number }
	| { kind: "request"; item: OperationalRequest; documents: DocumentRecord[] }
	| { kind: "mentors"; items: MentorRecord[]; total: number }
	| { kind: "schedules"; items: ScheduleRecord[]; total: number }
	| { kind: "teams"; items: TeamRecord[]; total: number }
	| { kind: "audit"; items: AuditEntry[]; total: number }
	| { kind: "error" }
	| { kind: "not-found" }
);

/** Memeriksa route dan sesi sebelum menjalankan pembacaan fitur staf. */
export async function loadStaffPage(
	role: StaffRole,
	segments: string[],
	input: Record<string, unknown>,
): Promise<StaffPageData> {
	const { supabase } = await requireSession([role]);
	const filters = parsePageFilters(input);
	const context = { role, filters };
	const requestPage = role === "admin" ? "operasional" : "pengajuan";
	try {
		if (segments[0] === requestPage) {
			if (segments.length === 1)
				return {
					...context,
					kind: "requests",
					...(await readRequests(supabase, filters)),
				};
			if (segments.length === 2 && z.uuid().safeParse(segments[1]).success) {
				const item = await readRequest(supabase, segments[1]);
				if (!item) return { ...context, kind: "not-found" };
				return {
					...context,
					kind: "request",
					item,
					documents: await readTeamDocuments(supabase, item.team_id),
				};
			}
		}
		if (segments.length !== 1) return { ...context, kind: "not-found" };
		if (segments[0] === "mentor")
			return {
				...context,
				kind: "mentors",
				...(await readMentors(supabase, filters)),
			};
		if (segments[0] === "jadwal")
			return {
				...context,
				kind: "schedules",
				...(await readSchedules(supabase, filters)),
			};
		if (segments[0] === "tim")
			return {
				...context,
				kind: "teams",
				...(await readTeams(supabase, filters)),
			};
		if (segments[0] === "audit" && role === "admin")
			return {
				...context,
				kind: "audit",
				...(await readAudit(supabase, filters)),
			};
		return { ...context, kind: "not-found" };
	} catch {
		return { ...context, kind: "error" };
	}
}
