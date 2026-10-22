// TODO: Gunakan query berizin untuk daftar pengajuan tim ketika penyimpanan produksi dihubungkan.
import type { DemoState, DemoUser } from "@/models/demo/types";
import { teamForUser, workIsReady } from "@/models/demo/selectors";
import { assertRequestCapacity } from "@/models/demo/request-policy";

/** Menyiapkan daftar aktif, riwayat dan pembatasan pengajuan hanya dari tim peserta yang sedang masuk. */
export function participantRequestsData(state: DemoState, actor: DemoUser) {
	const team = teamForUser(state, actor.id);
	const requests = state.requests
		.filter(
			/** Mencegah daftar dan statistik memuat pengajuan tim lain. */
			function ownedRequest(item) {
				return actor.role === "participant" && item.teamId === team?.id;
			},
		)
		.sort(
			/** Menampilkan pengajuan terbaru di urutan pertama. */
			function newestFirst(a, b) {
				return b.createdAt.localeCompare(a.createdAt);
			},
		);
	const active = requests.filter(
		/** Mengelompokkan pengajuan yang masih menunggu tindakan atau pelaksanaan sesi. */
		function ongoing(item) {
			return ["pending", "revision_requested", "approved"].includes(
				item.status,
			);
		},
	);
	const history = requests.filter(
		/** Mengelompokkan pengajuan yang prosesnya sudah berakhir. */
		function terminal(item) {
			return ["completed", "cancelled", "rejected"].includes(item.status);
		},
	);
	let restriction = !team
		? "Bentuk tim terlebih dahulu."
		: team.leaderId !== actor.id
			? "Pengajuan baru dikirim oleh ketua tim."
			: !workIsReady(state, team.id)
				? "Lengkapi Identitas Karya terlebih dahulu."
				: "";
	if (team && !restriction) {
		try {
			assertRequestCapacity(state, team.id);
		} catch (cause) {
			restriction =
				cause instanceof Error
					? cause.message
					: "Pengajuan belum dapat dilanjutkan.";
		}
	}
	return { team, requests, active, history, restriction };
}
