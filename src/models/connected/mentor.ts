// TODO: Pertahankan status slot berdasarkan booking aktual dan waktu server dalam zona WIB.
import { z } from "zod";
import type { MentorRecord, EventSettings } from "./operations";
import type { ParticipantTeam } from "./team";
export interface PublicMentor extends MentorRecord {
	achievements: string[];
}
export interface AvailableSlot {
	id: string;
	mentor_id: string;
	starts_at: string;
	ends_at: string;
	buffer_ends_at: string;
	enabled: boolean;
	is_booked: boolean;
}
export interface CatalogFilters {
	query: string;
	expertise: string;
	date: string;
	page: number;
}
export interface MentorDetailData {
	mentor: PublicMentor | null;
	slots: AvailableSlot[];
	settings: EventSettings | null;
	date: string;
	restriction: string;
	team: ParticipantTeam | null;
	error: boolean;
}

/** Memvalidasi filter katalog sebelum digunakan untuk menyusun kueri server. */
export function parseCatalogFilters(
	input: Record<string, unknown>,
): CatalogFilters {
	return {
		query: typeof input.q === "string" ? input.q.trim().slice(0, 100) : "",
		expertise: ["UI/UX", "Softdev", "IoT", "Gamedev"].includes(
			String(input.expertise),
		)
			? String(input.expertise)
			: "",
		date: z.iso.date().safeParse(input.date).success ? String(input.date) : "",
		page: z.coerce.number().int().min(1).max(1000).catch(1).parse(input.page),
	};
}
/** Menentukan label slot tanpa mengekspos identitas tim yang telah melakukan booking. */
export function slotAvailability(slot: AvailableSlot, now: number) {
	if (!slot.enabled) return "Tidak tersedia";
	if (new Date(slot.starts_at).getTime() <= now) return "Sudah lewat";
	if (slot.is_booked) return "Penuh";
	return "Tersedia";
}
