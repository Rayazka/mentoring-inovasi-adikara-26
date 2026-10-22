// TODO: Pertahankan idempotensi pengiriman dan snapshot karya pada transaksi pengajuan.
import { z } from "zod";
import type { requestStatuses } from "./operations";
import type {
	OperationalRequest,
	Relation,
	OperationalStatus,
} from "./operations";
import type { TeamDocument } from "./document";
import { relationValue } from "./operations";

/** Memilih waktu booking aktual bila tersedia agar perubahan jadwal tidak menampilkan slot lama. */
export function participantRequestSchedule(request: ParticipantRequest) {
	return relationValue(request.booking) ?? relationValue(request.slot);
}
export interface ParticipantRequest extends Omit<OperationalRequest, "mentor"> {
	mentor: Relation<{
		name: string;
		expertise: string;
		photo_url: string | null;
	}>;
	slot_id: string;
	revision_kind: "work" | "schedule" | "both" | null;
	booking: Relation<{ starts_at: string; ends_at: string; active: boolean }>;
}
export interface RequestDocumentSnapshot {
	document_id: string;
	title_snapshot: string;
	document: Relation<TeamDocument>;
}
export interface RequestEvent {
	id: string;
	action: string;
	note: string;
	created_at: string;
}
export interface ParticipantRequestFilters {
	tab: "active" | "history";
	status: OperationalStatus | "";
	query: string;
	page: number;
}

/** Memvalidasi parameter daftar tanpa membuka filter database yang tidak dikenal. */
export function parseParticipantRequestFilters(
	input: Record<string, unknown>,
): ParticipantRequestFilters {
	const statuses: OperationalStatus[] = [
		"pending",
		"revision_requested",
		"approved",
		"rejected",
		"cancelled",
		"completed",
	];
	return {
		tab: input.tab === "history" ? "history" : "active",
		status: statuses.includes(input.status as OperationalStatus)
			? (input.status as OperationalStatus)
			: "",
		query: typeof input.q === "string" ? input.q.trim().slice(0, 80) : "",
		page: z.coerce.number().int().min(1).max(10000).catch(1).parse(input.page),
	};
}
export const requestInput = z.object({
	slot: z.uuid(),
	key: z.uuid(),
	documents: z.array(z.uuid()).max(100),
});
export const requestStatusLabels: Record<
	(typeof requestStatuses)[number],
	string
> = {
	pending: "Menunggu keputusan",
	revision_requested: "Perlu revisi",
	approved: "Disetujui",
	rejected: "Ditolak",
	cancelled: "Dibatalkan",
	completed: "Selesai",
};

/** Mengubah pelanggaran aturan pengajuan menjadi pesan yang aman dan dapat ditindaklanjuti. */
export function requestMutationError(code?: string, message = "") {
	const known = [
		"Lengkapi Identitas Karya terlebih dahulu.",
		"Jadwal sudah terbooking.",
		"Dokumen belum siap, telah dihapus, atau bukan milik tim.",
		"Slot tidak tersedia atau sudah lewat.",
		"Pengajuan tidak sedang menunggu keputusan.",
	];
	if (known.includes(message)) return message;
	if (code === "23505")
		return "Masih ada pengajuan menunggu atau perlu revisi. Buka pengajuan aktif sebelum mengirim yang baru.";
	if (code === "42501")
		return "Kamu tidak memiliki izin mengirim pengajuan tim ini.";
	return "Pengajuan belum berhasil. Periksa karya, bahan, dan jadwal terbaru lalu coba lagi.";
}
