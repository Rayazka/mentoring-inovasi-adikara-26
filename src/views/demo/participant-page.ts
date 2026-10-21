// TODO: Tambahkan metadata halaman hanya setelah referensi visualnya diperiksa.
const pages: Record<string, { title: string; description: string }> = {
	"/peserta/tim": {
		title: "Tim Saya",
		description:
			"Kelola anggota, tinjau permintaan bergabung, dan siapkan karya timmu.",
	},
};
/** Memilih judul header untuk halaman peserta yang sudah disesuaikan dengan referensi. */
export function participantPage(pathname: string) {
	return pages[pathname];
}
