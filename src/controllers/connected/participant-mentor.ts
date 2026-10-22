// TODO: Pertahankan browsing mentor tanpa tim sambil memvalidasi ulang prasyarat pada pengajuan.
import "server-only";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
	parseCatalogFilters,
	type MentorDetailData,
} from "@/models/connected/mentor";
import {
	readMentorCatalog,
	readPublicMentor,
	readAvailableSlots,
	readEventSettings,
} from "@/models/connected/mentor-repository";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { readTeamWork } from "@/models/connected/work-repository";
import { isConnectedWorkReady } from "@/models/connected/work";

/** Memuat katalog dengan filter yang tetap tersedia ketika kueri gagal. */
export async function loadParticipantCatalog(input: Record<string, unknown>) {
	const { supabase } = await requireSession(["participant"]);
	const filters = parseCatalogFilters(input);
	try {
		const [catalog, settings] = await Promise.all([
			readMentorCatalog(supabase, filters),
			readEventSettings(supabase),
		]);
		return { ...catalog, filters, dates: settings.dates, error: false };
	} catch {
		return { mentors: [], total: 0, filters, dates: [], error: true };
	}
}
/** Memuat profil, slot aktual dan alasan prasyarat tanpa membuka karya tim lain. */
export async function loadParticipantMentor(
	id: string,
	requestedDate: unknown,
): Promise<MentorDetailData> {
	const { supabase, user } = await requireSession(["participant"]);
	const empty: MentorDetailData = {
		mentor: null,
		slots: [],
		settings: null,
		date: "",
		restriction: "",
		team: null,
		error: false,
	};
	if (!z.uuid().safeParse(id).success) return empty;
	try {
		const [mentor, settings, team] = await Promise.all([
			readPublicMentor(supabase, id),
			readEventSettings(supabase),
			readParticipantTeam(supabase, user.id),
		]);
		if (!mentor) return empty;
		const availableDates = mentor.available_dates.filter(
			/** Membatasi hari pilihan pada irisan tanggal acara dan ketersediaan mentor. */
			function eventDate(date) {
				return settings.dates.includes(date);
			},
		);
		const date =
			typeof requestedDate === "string" &&
			availableDates.includes(requestedDate)
				? requestedDate
				: (availableDates[0] ?? "");
		const [slots, work] = await Promise.all([
			date ? readAvailableSlots(supabase, id, date) : [],
			team ? readTeamWork(supabase, team.id) : null,
		]);
		const restriction = !team
			? "Bentuk atau bergabung dengan tim terlebih dahulu."
			: team.leader_id !== user.id
				? "Pengajuan mentoring hanya dapat dikirim oleh ketua tim."
				: !isConnectedWorkReady(work)
					? "Lengkapi dan simpan Identitas Karya terlebih dahulu."
					: "";
		return { mentor, settings, team, date, slots, restriction, error: false };
	} catch {
		return { ...empty, error: true };
	}
}
