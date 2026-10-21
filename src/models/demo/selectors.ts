// TODO: Sesuaikan proyeksi data ini dengan query berizin ketika database dihubungkan.
import type { DemoState, DemoUser } from "./types";

/** Mengambil tim milik pengguna tanpa memberi akses dari parameter tim bebas. */
export function teamForUser(state: DemoState, userId: string) {
	return state.teams.find(
		/** Memilih tim dengan keanggotaan yang masih aktif. */
		function membership(team) {
			return team.memberIds.includes(userId);
		},
	);
}

/** Mengizinkan anggota aktif, admin, atau mentor yang menerima pengajuan tim untuk melihat karya. */
export function canReadTeam(state: DemoState, user: DemoUser, teamId: string) {
	if (user.role === "admin") return true;
	if (user.role === "participant")
		return teamForUser(state, user.id)?.id === teamId;
	return state.requests.some(
		/** Membatasi mentor pada karya tim yang pernah mengajukan mentoring kepadanya. */
		function assignedTeam(request) {
			return request.teamId === teamId && request.mentorId === user.mentorId;
		},
	);
}

/** Menilai judul dan deskripsi wajib sebelum karya dapat dipakai untuk pengajuan. */
export function workIsReady(state: DemoState, teamId: string) {
	const work = state.works.find(
		/** Memilih identitas karya yang dimiliki tim. */
		function teamWork(item) {
			return item.teamId === teamId;
		},
	);
	return Boolean(work?.title.trim() && work.description.trim());
}
