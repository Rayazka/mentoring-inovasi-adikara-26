// TODO: Pertahankan status pemuatan yang ringkas tanpa mengganti data produksi dengan contoh.
/** Memberi umpan balik aksesibel selama halaman peserta memuat data sesi dan tim. */
export default function Loading() {
	return (
		<p className="notice" role="status">
			Memuat ruang mentoring…
		</p>
	);
}
