// TODO: Terapkan relasi akun mentor nullable dan invariant ini pada migrasi database produksi.
import type { DemoState, Mentor } from "./types";

/** Memeriksa mentor aktif yang benar-benar ditautkan ke akun pemilik sesi. */
export function mentorForUser(
	state: DemoState,
	userId: string,
): Mentor | undefined {
	return state.mentors.find(
		/** Membatasi profil yang dapat dikelola berdasarkan relasi dua arah akun dan mentor. */
		function linkedMentor(mentor) {
			const account = state.users.find(
				/** Mengambil role dan penautan akun yang masih berlaku. */
				function matchingAccount(user) {
					return user.id === userId;
				},
			);
			return (
				mentor.userId === userId &&
				account?.role === "mentor" &&
				account.mentorId === mentor.id &&
				mentor.active &&
				!mentor.archived
			);
		},
	);
}

/** Memisahkan data katalog dari pengenal akun internal pada proyeksi publik. */
export function publicMentor(mentor: Mentor) {
	const { userId: _userId, ...profile } = mentor;
	return profile;
}

/** Mencegah penonaktifan atau pengarsipan ketika mentor masih bertanggung jawab atas kegiatan aktif. */
export function mentorHasActivity(state: DemoState, mentorId: string) {
	return state.requests.some(
		/** Mengidentifikasi permintaan berjalan atau sesi yang belum ditutup. */
		function activeActivity(request) {
			return (
				request.mentorId === mentorId &&
				["pending", "revision_requested", "approved"].includes(request.status)
			);
		},
	);
}
