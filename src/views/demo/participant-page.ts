// TODO: Tambahkan metadata halaman hanya setelah referensi visualnya diperiksa.
const pages: Record<string, { title: string; description: string }> = {
	"/peserta/tim": {
		title: "Tim Saya",
		description:
			"Kelola anggota, tinjau permintaan bergabung, dan siapkan karya timmu.",
	},
	"/peserta/karya": {
		title: "Identitas Karya",
		description:
			"Ceritakan karya timmu dan siapkan bahan diskusi untuk mentor.",
	},
	"/peserta/mentor": {
		title: "Cari Mentor",
		description:
			"Temukan keahlian yang sesuai dengan tantangan dan arah karya timmu.",
	},
	"/peserta/pengajuan": {
		title: "Pengajuan Mentoring",
		description:
			"Pantau status pengajuan mentoring timmu dan lanjutkan sesi yang sudah dijadwalkan.",
	},
};
/** Memilih judul header untuk halaman peserta yang sudah disesuaikan dengan referensi. */
export function participantPage(pathname: string) {
	if (/^\/peserta\/mentor\/[^/]+$/.test(pathname))
		return {
			title: "Detail Mentor",
			description: "Kenali mentor dan pilih waktu diskusi timmu.",
			back: true,
		};
	return pages[pathname];
}
