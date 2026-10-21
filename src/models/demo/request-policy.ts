// TODO: Pindahkan validasi transisi dan reservasi ke transaksi database yang terotorisasi pada produksi.
import type { DemoState, MentoringRequest, RequestStatus } from "./types";
import { mentorForUser } from "./mentor-policy";
import { slotsOverlap } from "./slot-policy";
import { teamForUser } from "./selectors";

const transitions: Record<RequestStatus, RequestStatus[]> = {
	pending: ["revision_requested", "approved", "rejected", "cancelled"],
	revision_requested: ["pending", "rejected", "cancelled"],
	approved: ["completed", "cancelled"],
	rejected: [],
	cancelled: [],
	completed: [],
};

/** Mengubah status hanya melalui transisi sah agar status terminal tidak dihidupkan ulang. */
export function transitionRequest(
	request: MentoringRequest,
	next: RequestStatus,
) {
	if (!transitions[request.status].includes(next))
		throw new Error(
			`Status ${request.status} tidak dapat diubah menjadi ${next}.`,
		);
	request.status = next;
}

/** Mengambil pengajuan hanya bagi tim pemilik, mentor terkait yang aktif, atau admin operasional. */
export function requestForActor(state: DemoState, requestId: string) {
	const actor = state.users.find(
		/** Mengambil identitas akun dari sesi lokal yang sedang aktif. */
		function activeActor(user) {
			return user.id === state.userId;
		},
	);
	const request = state.requests.find(
		/** Memilih identitas pengajuan yang diminta oleh halaman detail. */
		function requestedItem(item) {
			return item.id === requestId;
		},
	);
	if (!actor || !request)
		throw new Error("Pengajuan tidak ditemukan atau sesi tidak tersedia.");
	const permitted =
		actor.role === "admin" ||
		(actor.role === "participant" &&
			teamForUser(state, actor.id)?.id === request.teamId) ||
		(actor.role === "mentor" &&
			mentorForUser(state, actor.id)?.id === request.mentorId);
	if (!permitted)
		throw new Error("Kamu tidak dapat mengakses pengajuan tim ini.");
	return request;
}

/** Memvalidasi kembali jadwal terbaru termasuk benturan buffer dengan booking yang sudah terkonfirmasi. */
export function availableRequestSlot(
	state: DemoState,
	slotId: string,
	mentorId: string,
	exceptRequestId = "",
) {
	const mentor = state.mentors.find(
		/** Menolak mentor yang nonaktif atau sudah diarsipkan meskipun slot masih tersimpan. */
		function activeMentor(item) {
			return item.id === mentorId && item.active && !item.archived;
		},
	);
	const slot = state.slots.find(
		/** Memastikan slot milik mentor yang dipilih dan masih diaktifkan. */
		function selectedSlot(item) {
			return item.id === slotId && item.mentorId === mentorId && item.enabled;
		},
	);
	if (!mentor || !slot || !mentor.dates.includes(slot.date))
		throw new Error(
			"Mentor atau slot sudah tidak tersedia. Pilih jadwal lain.",
		);
	if (new Date(`${slot.date}T${slot.start}:00+07:00`).getTime() <= Date.now())
		throw new Error("Jadwal sudah lewat. Pilih waktu berikutnya.");
	const conflict = state.requests.some(
		/** Memeriksa benturan penuh dengan semua reservasi lain yang masih menguasai slot. */
		function bookedRequest(request) {
			if (
				request.id === exceptRequestId ||
				!["approved", "completed"].includes(request.status)
			)
				return false;
			const booked = state.slots.find(
				/** Mengambil rentang waktu yang disimpan pada reservasi sebelumnya. */
				function bookedSlot(item) {
					return item.id === request.slotId;
				},
			);
			return Boolean(booked && slotsOverlap(booked, slot));
		},
	);
	if (conflict) throw new Error("Jadwal sudah terbooking. Pilih slot lain.");
	return slot;
}

/** Mengunci batas demo satu pengajuan menunggu/revisi per tim tanpa menganggap pending sebagai booking. */
export function assertRequestCapacity(
	state: DemoState,
	teamId: string,
	exceptRequestId = "",
) {
	if (
		state.requests.some(
			/** Mencari pengajuan berjalan lain milik tim yang sama. */
			function activeRequest(request) {
				return (
					request.id !== exceptRequestId &&
					request.teamId === teamId &&
					["pending", "revision_requested"].includes(request.status)
				);
			},
		)
	)
		throw new Error(
			"Tim masih memiliki pengajuan menunggu atau perlu revisi. Tuntaskan terlebih dahulu.",
		);
}
