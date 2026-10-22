// TODO: Pertahankan pemilihan ulang slot dari mentor yang sama saat karya dan bahan direvisi.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readTeamWork } from "@/models/connected/work-repository";
import { readWorkDocuments } from "@/models/connected/document-repository";
import {
	readPublicMentor,
	readAvailableSlots,
	readEventSettings,
} from "@/models/connected/mentor-repository";
import { isConnectedWorkReady } from "@/models/connected/work";
import { slotAvailability } from "@/models/connected/mentor";

/** Memuat bahan revisi setelah controller induk memverifikasi ketua dan kepemilikan pengajuan. */
export async function loadRequestRevision(
	client: SupabaseClient,
	teamId: string,
	mentorId: string,
) {
	const [work, documents, mentor, settings] = await Promise.all([
		readTeamWork(client, teamId),
		readWorkDocuments(client, teamId),
		readPublicMentor(client, mentorId),
		readEventSettings(client),
	]);
	const dates =
		mentor?.available_dates.filter(
			/** Membatasi revisi pada hari mentor yang masih menjadi tanggal acara. */
			function eventDate(date) {
				return settings.dates.includes(date);
			},
		) ?? [];
	const groups = await Promise.all(
		dates.map(
			/** Membaca ketersediaan aktual tanpa membuka data booking tim lain. */
			function slotsForDay(date) {
				return readAvailableSlots(client, mentorId, date);
			},
		),
	);
	return {
		work,
		ready: isConnectedWorkReady(work),
		documents: documents.filter(
			/** Menawarkan hanya bahan yang telah siap dibaca mentor. */
			function readyDocument(item) {
				return item.ready;
			},
		),
		slots: groups.flat().filter(
			/** Menghilangkan pilihan yang sudah penuh, dinonaktifkan, atau lewat. */
			function available(slot) {
				return slotAvailability(slot, Date.now()) === "Tersedia";
			},
		),
	};
}
