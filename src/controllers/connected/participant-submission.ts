// TODO: Pertahankan pemeriksaan slot terakhir ketika peserta berpindah dari katalog ke review.
import "server-only";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { readTeamWork } from "@/models/connected/work-repository";
import { readWorkDocuments } from "@/models/connected/document-repository";
import {
	readPublicMentor,
	readAvailableSlots,
} from "@/models/connected/mentor-repository";
import { isConnectedWorkReady } from "@/models/connected/work";
import { slotAvailability } from "@/models/connected/mentor";

/** Memuat ringkasan pengajuan hanya untuk ketua tim dengan karya dan slot yang masih valid. */
export async function loadParticipantSubmission(
	mentorId: unknown,
	slotId: unknown,
) {
	const { supabase, user } = await requireSession(["participant"]);
	if (
		!z.uuid().safeParse(mentorId).success ||
		!z.uuid().safeParse(slotId).success
	)
		return {
			kind: "restricted" as const,
			message: "Pilih mentor dan jadwal terlebih dahulu.",
			href: "/peserta/mentor",
		};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team)
			return {
				kind: "restricted" as const,
				message: "Bentuk atau bergabung dengan tim terlebih dahulu.",
				href: "/peserta/tim",
			};
		if (team.leader_id !== user.id)
			return {
				kind: "restricted" as const,
				message: "Hanya ketua tim yang dapat mengirim pengajuan.",
				href: "/peserta/tim",
			};
		const work = await readTeamWork(supabase, team.id);
		if (!work || !isConnectedWorkReady(work))
			return {
				kind: "restricted" as const,
				message: "Lengkapi dan simpan Identitas Karya terlebih dahulu.",
				href: "/peserta/karya#judul-topik",
			};
		const { data: slot, error } = await supabase
			.from("mentor_slots")
			.select("id,mentor_id,starts_at")
			.eq("id", String(slotId))
			.eq("mentor_id", String(mentorId))
			.maybeSingle();
		if (error) throw new Error("Pembacaan jadwal gagal.");
		if (!slot)
			return {
				kind: "restricted" as const,
				message: "Jadwal tidak tersedia. Pilih kembali dari profil mentor.",
				href: "/peserta/mentor",
			};
		const day = new Intl.DateTimeFormat("en-CA", {
			timeZone: "Asia/Jakarta",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		}).format(new Date(slot.starts_at));
		const [mentor, slots, documents] = await Promise.all([
			readPublicMentor(supabase, String(mentorId)),
			readAvailableSlots(supabase, String(mentorId), day),
			readWorkDocuments(supabase, team.id),
		]);
		const selected = slots.find(
			/** Memeriksa status slot terbaru tanpa membaca identitas tim yang telah melakukan booking. */
			function available(item) {
				return (
					item.id === slotId &&
					slotAvailability(item, Date.now()) === "Tersedia"
				);
			},
		);
		if (!mentor || !selected || !mentor.available_dates.includes(day))
			return {
				kind: "restricted" as const,
				message:
					"Jadwal baru saja berubah atau tidak tersedia. Pilih kembali jadwal mentoring.",
				href: `/peserta/mentor/${mentorId}`,
			};
		return {
			kind: "ready" as const,
			mentor,
			slot: selected,
			team,
			work,
			documents: documents.filter(
				/** Menawarkan hanya bahan yang telah selesai diunggah untuk snapshot pengajuan. */
				function ready(item) {
					return item.ready;
				},
			),
			key: crypto.randomUUID(),
		};
	} catch {
		return { kind: "error" as const };
	}
}
