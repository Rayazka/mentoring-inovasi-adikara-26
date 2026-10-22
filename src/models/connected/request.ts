// TODO: Pertahankan idempotensi pengiriman dan snapshot karya pada transaksi pengajuan.
import { z } from "zod";
import type { requestStatuses } from "./operations";
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
