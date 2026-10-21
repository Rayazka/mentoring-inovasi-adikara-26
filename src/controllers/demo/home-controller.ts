// TODO: Pertahankan derivasi kondisi Home yang sama saat repository browser diganti query server.
import type { DemoState, DemoUser } from "@/models/demo/types";
import { teamForUser, workIsReady } from "@/models/demo/selectors";

/** Menurunkan ringkasan Home dari data tim dan pengajuan tanpa angka progres atau jadwal rekaan. */
export function participantHomeData(state: DemoState, actor: DemoUser) {
	const team = teamForUser(state, actor.id);
	const work = state.works.find(
		/** Mengambil identitas karya yang benar-benar dimiliki tim aktif. */
		function ownedWork(item) {
			return item.teamId === team?.id;
		},
	);
	const requests = state.requests.filter(
		/** Membatasi pengajuan pada tim aktif akun yang sedang masuk. */
		function ownedRequest(item) {
			return item.teamId === team?.id;
		},
	);
	const request =
		requests.find(
			/** Mengutamakan sesi terkonfirmasi sebagai persiapan diskusi berikutnya. */
			function approvedSession(item) {
				return item.status === "approved";
			},
		) ??
		requests.find(
			/** Menampilkan pengajuan berjalan bila tim belum memiliki sesi terkonfirmasi. */
			function ongoingRequest(item) {
				return ["pending", "revision_requested"].includes(item.status);
			},
		) ??
		requests[0];
	const slot = state.slots.find(
		/** Mengambil jam dari pengajuan yang ada alih-alih menampilkan fixture saat kondisi kosong. */
		function requestedSlot(item) {
			return item.id === request?.slotId;
		},
	);
	const mentor = state.mentors.find(
		/** Mengambil nama dan bidang mentor yang terkait pengajuan tim. */
		function selectedMentor(item) {
			return item.id === request?.mentorId;
		},
	);
	const ready = Boolean(team && workIsReady(state, team.id));
	const documents = state.documents.filter(
		/** Menghitung bahan yang benar-benar tersedia pada tim aktif. */
		function teamDocument(item) {
			return item.teamId === team?.id;
		},
	);
	const files = documents.filter(
		/** Menghitung jumlah berkas tanpa menghitung link sebagai file. */
		function fileDocument(item) {
			return item.kind === "file";
		},
	).length;
	const joins = state.joins.filter(
		/** Membatasi jumlah permintaan bergabung pada tim yang dikelola ketua. */
		function teamJoin(item) {
			return item.teamId === team?.id && item.status === "pending";
		},
	).length;
	const greeting = !team
		? "Mulai dari tim, lalu siapkan karya dan mentoringmu."
		: !ready
			? "Lengkapi gambaran karyamu agar mentor memahami arah timmu."
			: request?.status === "approved"
				? "Sesi timmu sudah siap. Siapkan pertanyaan terbaikmu."
				: request?.status === "revision_requested"
					? "Ada masukan mentor. Tinjau revisi untuk melanjutkan mentoring."
					: request?.status === "pending"
						? "Pengajuan terkirim. Pantau respons mentor dari sini."
						: "Karyamu siap. Temukan mentor yang tepat untuk langkah berikutnya.";
	return {
		team,
		work,
		request,
		slot,
		mentor,
		ready,
		files,
		links: documents.length - files,
		joins,
		greeting,
		leader: team?.leaderId === actor.id,
	};
}
