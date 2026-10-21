// TODO: Pertahankan ID stabil agar publikasi backlog tidak menggandakan issue.
export const repository = "Rayazka/mentoring-inovasi-adikara-26";
export const stages = [
	[
		"D0",
		"Penyelarasan produk dan desain",
		"Frame, route, state, dan kebijakan yang relevan siap menjadi acuan implementasi.",
	],
	[
		"D1",
		"Supabase dan Google authentication",
		"Login nyata dan otorisasi lintas peran teruji pada environment uji.",
	],
	[
		"D2",
		"Design system dan application shell",
		"Komponen dan layout responsif mengikuti canvas terbaru.",
	],
	[
		"D3",
		"Tim dan keanggotaan",
		"Pengelolaan tim bekerja dengan kapasitas dan hak akses yang konsisten.",
	],
	[
		"D4",
		"Identitas Karya dan dokumen privat",
		"Karya serta bahan mentoring dapat dikelola dan diakses secara sah.",
	],
	[
		"D5",
		"Mentor CRUD dan jadwal",
		"Data mentor dan ketersediaan siap dipakai peserta, mentor, serta admin.",
	],
	[
		"D6",
		"Pengajuan dan keputusan mentor",
		"Alur submit sampai keputusan berjalan dengan booking atomik.",
	],
	[
		"D7",
		"Revisi dan lifecycle sesi",
		"Revisi, perubahan jadwal, pembatalan, dan penyelesaian menjaga integritas sesi.",
	],
	[
		"D8",
		"Dashboard dan operasional",
		"Ringkasan, notifikasi dan operasi admin menggunakan data nyata.",
	],
	[
		"D9",
		"QA dan penerimaan",
		"Keamanan akses, transaksi bersamaan, alur E2E dan visual terverifikasi.",
	],
	[
		"D10",
		"Deployment dan dukungan acara",
		"Staging, UAT, produksi dan prosedur pemulihan siap digunakan.",
	],
	[
		"FUTURE",
		"Pengembangan lanjutan",
		"Fitur tambahan dipertimbangkan setelah alur inti stabil; bukan janji rilis acara.",
	],
].map(
	/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
	([id, title, outcome]) => ({ id, title, outcome }),
);

const make =
	/** Menjalankan langkah make sesuai tanggung jawab modul ini. */
	(
		id,
		stage,
		area,
		title,
		scope,
		acceptance,
		verification,
		dependencies = "",
		frames = "",
	) => ({
		id,
		stage,
		area,
		title,
		scope,
		acceptance,
		verification,
		dependencies: dependencies.split(" ").filter(Boolean),
		frames: frames.split(" ").filter(Boolean),
		kind: "task",
		priority: stage === "FUTURE" ? "P2" : "P0",
	});

export const decisions = [
	[
		"DEC-01",
		"D3",
		"team",
		"Tetapkan keanggotaan, approval join, dan hak ketua/anggota",
		[
			"Apakah satu peserta hanya boleh memiliki satu tim aktif?",
			"Apakah join memerlukan approval ketua? Siapa boleh edit karya, submit, merespons revisi, dan keluar saat ada pengajuan aktif?",
		],
		[
			"Keputusan ketua/anggota dan pindah kepemimpinan tercatat per tindakan.",
			"PRD dan acceptance criteria modul tim/karya diperbarui; asumsi lama tidak dianggap otomatis disetujui.",
		],
	],
	[
		"DEC-02",
		"D4",
		"documents",
		"Tetapkan kelengkapan karya dan kebijakan upload",
		[
			"Judul/deskripsi wajib; putuskan apakah minimal satu dokumen/link juga wajib untuk submit.",
			"Tentukan jenis file, ukuran, kuota, retensi, dan penanganan file tidak aman.",
		],
		[
			"Ada nilai kebijakan yang dapat ditegakkan di UI, server dan Storage.",
			"Perbedaan simpan draf dan siap mengajukan dijelaskan; tidak ada batas numerik rekaan.",
		],
	],
	[
		"DEC-03",
		"D4",
		"security",
		"Tetapkan akses dokumen setelah relasi berakhir dan akses admin",
		[
			"Tentukan akses mentor ketika pending, ditolak, dibatalkan, selesai atau diarsipkan.",
			"Tentukan apakah admin dapat membaca isi dokumen atau hanya metadata, serta akses historis mantan anggota.",
		],
		[
			"Matriks baca/ubah/hapus/unduh per role dan status disetujui.",
			"Snapshot pengajuan dan retensi dokumen tidak mengabaikan pencabutan izin.",
		],
	],
	[
		"DEC-04",
		"D6",
		"booking",
		"Tetapkan batas pengajuan, sesi total, dan benturan jadwal tim",
		[
			"Konfirmasi satu pending/revision aktif per tim dan perlakuan setelah approved.",
			"Tentukan jumlah sesi total, sesi lintas mentor, dan larangan overlap tim.",
		],
		[
			"Batas serta status yang dihitung tercatat eksplisit.",
			"Pesan penolakan dan aturan transaksi/constraint diturunkan dari keputusan yang sama.",
		],
	],
	[
		"DEC-05",
		"D7",
		"booking",
		"Pastikan arti H-1 dan jalur pembatalan darurat",
		[
			"Konfirmasi 24 jam berjalan atau hari kalender sebelum sesi.",
			"Tentukan pelaku, alasan, serta perubahan sesi approved yang harus disetujui tim.",
		],
		[
			"Contoh batas waktu WIB disepakati termasuk tepat pada batas.",
			"Pembatalan admin darurat dan pelepasan slot memiliki audit serta pemberitahuan.",
		],
	],
	[
		"DEC-06",
		"D1",
		"auth",
		"Tetapkan eligibility peserta, profil minimum, dan model role",
		[
			"Apakah akun harus cocok dengan daftar pendaftaran lomba? Apakah tim lintas institusi boleh?",
			"Konfirmasi satu role aktif atau kebutuhan multi-role dalam satu akun; tetapkan data profil minimum.",
		],
		[
			"Aturan eligibility diterapkan sebelum aplikasi dibuka publik.",
			"Pemberian peran mentor/admin tidak bersumber dari metadata pengguna atau pencocokan nama saja.",
		],
	],
	[
		"DEC-07",
		"D5",
		"mentor",
		"Validasi data mentor, ejaan, foto dan jadwal aktual",
		[
			"Konfirmasi Nauval Yushriya/Yusriya, foto Wildan, dan pemetaan kedelapan foto.",
			"Kumpulkan akun Google sah dan ketersediaan mentor; Emirsyah hanya 24 Oktober.",
		],
		[
			"Sembilan mentor memiliki ID tetap dan pemetaan aset yang jelas; kekosongan tetap memakai inisial.",
			"Jam default tidak dianggap persetujuan ketersediaan seluruh mentor; kontak WhatsApp tetap privat.",
		],
	],
	[
		"DEC-08",
		"D2",
		"product",
		"Tetapkan visibilitas Discord dan sumber daya publik",
		[
			"Konfirmasi apakah Discord hanya tampil setelah login.",
			"Pertahankan empat URL penting yang diberikan; jangan menganggap link Discord sebagai integrasi bot.",
		],
		[
			"Lokasi tampil dan hak akses link tercatat.",
			"Tidak menambahkan destinasi/footer login tanpa URL nyata dan kebutuhan yang jelas.",
		],
	],
].map(
	/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
	([id, stage, area, title, scope, acceptance]) => ({
		id,
		stage,
		area,
		title,
		scope,
		acceptance,
		kind: "decision",
		priority: "P0",
		dependencies: [],
		frames: [],
		verification: [
			"Catat jawaban pemilik produk, perbarui spesifikasi serta issue implementasi yang terdampak; tutup hanya setelah keputusan tersedia.",
		],
	}),
);

export const tasks = [
	make(
		"DES-01",
		"D0",
		"design",
		"Kunci matriks route, frame V2, dan state implementasi",
		[
			"Petakan login, peserta, mentor dan admin dari canvas terbaru; bedakan V1, V2, state dan halaman.",
			"Perbarui screen index/handoff yang tertinggal tanpa menghapus pekerjaan desain lain.",
		],
		[
			"Setiap route inti memiliki frame acuan dan daftar state; Home memakai V2.",
			"Identitas Karya menjadi sumber topik; peserta mobile memakai drawer, bukan bottom nav V1.",
		],
		[
			"Tinjau matriks terhadap canvas dan planning; verifikasi ID frame masih ada.",
		],
		"",
		"M2j3WV YZhiC qZHSE P8uOso Sqq5i C7k5Y",
	),
	make(
		"DES-02",
		"D0",
		"design",
		"Selesaikan gap frame admin dan copy booking yang tidak konsisten",
		[
			"Rakit/konfirmasi konten terpisah pada Edit Mentor, Operasional dan Audit.",
			"Selaraskan copy topik, jam operasional, fixtures tim dan tanggal kegiatan.",
		],
		[
			"M7eio, uksG7, MkATB memiliki acuan konten yang dapat dibandingkan dengan implementasi.",
			"Tidak ada pengisian ulang karya atau fixture status/tanggal lintas tim sebagai aturan produk.",
		],
		[
			"Periksa hasil canvas dan screenshot acuan tanpa clipping; catat gap yang belum diselesaikan.",
		],
		"DES-01",
		"M7eio uksG7 MkATB kw3pR",
	),
	make(
		"DES-03",
		"D0",
		"design",
		"Lengkapi kontrak responsif, aksesibilitas dan state lintas halaman",
		[
			"Dokumentasikan desktop 1440, mobile 390, sidebar 248/72, drawer, tabel, form dan dialog.",
			"Petakan loading, kosong, gagal, akses berubah, nonketua, retry dan fokus.",
		],
		[
			"Seluruh alur inti memiliki perilaku mobile dan keyboard yang jelas.",
			"Oranye tidak menjadi satu-satunya penanda kontrol penting; tidak ada nested link/button pada kartu.",
		],
		[
			"Review matriks state dan navigasi dengan login/Home V2 serta papan dialog.",
		],
		"DES-01",
		"JaRHB TLHMy QzEN0",
	),

	make(
		"AUTH-01",
		"D1",
		"auth",
		"Siapkan Supabase development/staging dan alur migrasi yang dapat diulang",
		[
			"Buat/konfigurasi project yang terpisah dari produksi, environment lokal dan validasi konfigurasi.",
			"Terapkan fondasi profiles; siapkan migrasi berurutan, reset database uji dan panduan bootstrap.",
		],
		[
			"Environment tidak menyimpan secret dalam Git atau variabel NEXT_PUBLIC.",
			"Database kosong dapat direkonstruksi; trigger profil bekerja untuk akun baru dan backfill aman.",
		],
		[
			"Jalankan migrasi dari nol pada database uji dan periksa profile trigger/RLS.",
		],
		"",
	),
	make(
		"AUTH-02",
		"D1",
		"auth",
		"Uji dan tuntaskan Google OAuth, callback, refresh dan logout",
		[
			"Hubungkan kode dasar dengan Google provider serta callback lokal/staging yang benar.",
			"Tangani kegagalan login, kode invalid, session expiry dan logout.",
		],
		[
			"Akun Google nyata berhasil login dan refresh tanpa kehilangan sesi.",
			"Callback tidak menerima redirect eksternal sembarang; logout menutup akses halaman privat.",
		],
		[
			"Uji manual OAuth dan otomatisasi kegagalan/session routing; sertakan bukti tanpa token.",
		],
		"AUTH-01",
		"M2j3WV",
	),
	make(
		"AUTH-03",
		"D1",
		"security",
		"Tuntaskan otorisasi role dan bootstrap admin yang terverifikasi",
		[
			"Terapkan keputusan eligibility/model role pada guard server dan database.",
			"Bootstrap admin dengan identitas terverifikasi; periksa akses langsung dan mutasi role.",
		],
		[
			"Peserta/mentor/admin diarahkan ke ruang tepat; metadata role palsu tidak memberi akses.",
			"Akun yang dicabut/diarsipkan tidak mempertahankan akses mentor lewat sesi lama.",
		],
		[
			"Uji role berbeda, anonymous, payload manipulasi dan akses langsung ke action/database.",
		],
		"AUTH-02 DEC-06",
	),

	make(
		"UI-01",
		"D2",
		"design",
		"Implementasikan token desain, font dan aset resmi",
		[
			"Turunkan warna, spacing, radius, tipe dan focus dari canvas/PDF ke token aplikasi.",
			"Siapkan pemakaian logo, ornamen, foto/crop wajah dan fallback font yang tersedia.",
		],
		[
			"Komponen memakai token semantik dan konsisten dengan login terbaru.",
			"Logo tidak digambar ulang; font gagal dimuat tetap terbaca dan layout stabil.",
		],
		[
			"Bandingkan style dengan sumber dan uji fallback/font loading pada desktop/mobile.",
		],
		"DES-01",
	),
	make(
		"UI-02",
		"D2",
		"frontend",
		"Bangun komponen interaktif reusable dan kartu mentor rata tengah",
		[
			"Button, field, tabs, status, dialog, avatar, slot, dokumen dan alert memakai token.",
			"Mentor card rata tengah dengan foto lingkaran dan tinggi/CTA konsisten.",
		],
		[
			"Default/focus/loading/disabled/error tersedia dengan label yang terbaca.",
			"Dialog mengelola focus trap, Escape dan return focus; kartu tidak menumpuk tautan bersarang.",
		],
		[
			"Uji keyboard dan komponen berisiko; visual desktop/mobile serta nama mentor panjang.",
		],
		"UI-01 DES-03",
	),
	make(
		"UI-03",
		"D2",
		"frontend",
		"Bangun shell peserta, mentor dan admin dengan sidebar responsif",
		[
			"Sidebar role, active route, collapse 248/72, header dan drawer mobile.",
			"Menu peserta: Home, Tim Saya, Identitas Karya, Cari Mentor, Pengajuan Mentoring.",
		],
		[
			"Role tidak melihat tindakan/menu di luar haknya; guard tetap berlaku di server.",
			"Drawer dapat dibuka/ditutup via keyboard dan fokus kembali ke pemicu; state collapse tidak merusak konten.",
		],
		[
			"Navigasi langsung/nested route dan resize 390–1440; uji collapse/drawer tanpa overlap.",
		],
		"UI-02 AUTH-03",
		"JaRHB M8loRT H5XAA eZ0lt kL0JC",
	),
	make(
		"UI-04",
		"D2",
		"frontend",
		"Implementasikan halaman login dan Link Penting sesuai desain final",
		[
			"Bangun pengenalan mentoring, tanggal, mentor preview dan Google-only login.",
			"Panel resource memakai empat URL resmi dan visibilitas Discord yang disepakati.",
		],
		[
			"CTA Google terhubung autentikasi nyata; tidak ada login password/role selector.",
			"Link eksternal valid sesuai input pengguna, ornamen resmi dan mobile bertumpuk.",
		],
		[
			"Uji CTA/login error dan tautan; screenshot desktop/mobile dibanding M2j3WV.",
		],
		"UI-02 AUTH-02 DEC-08",
		"M2j3WV EZA3v",
	),

	make(
		"TEAM-01",
		"D3",
		"team",
		"Bangun skema dan transaksi tim, anggota serta permintaan join",
		[
			"Migrasi teams/members/join requests dengan constraints dan RLS sesuai keputusan.",
			"Create/join/review/leave/transfer memakai transaksi dan pemeriksaan identitas.",
		],
		[
			"Maksimal tiga anggota termasuk ketua; dua approval untuk kursi terakhir tidak sama-sama berhasil.",
			"Ketua selalu anggota aktif; keanggotaan aktif tidak melebihi batas yang diputuskan.",
		],
		["Tes database/RLS dan dua koneksi bersamaan untuk kapasitas/keanggotaan."],
		"AUTH-03 DEC-01",
	),
	make(
		"TEAM-02",
		"D3",
		"team",
		"Implementasikan buat, cari dan ajukan bergabung dengan tim",
		[
			"Halaman tanpa tim, form buat, pencarian, detail publik aman dan request join.",
			"Pending join bukan keanggotaan; tim penuh dan hasil pencarian kosong dijelaskan.",
		],
		[
			"Tim baru memberi peran ketua pada pembuat; submit ulang tidak membuat tim ganda.",
			"Calon anggota tidak dapat melihat karya, kontak privat atau dokumen tim lain.",
		],
		["E2E buat/cari/join, retry, tim penuh dan akses detail privat."],
		"TEAM-01 UI-03",
		"qZHSE",
	),
	make(
		"TEAM-03",
		"D3",
		"team",
		"Implementasikan tab anggota dan review permintaan bergabung oleh ketua",
		[
			"Ringkasan, Anggota, dan Permintaan Bergabung dengan count data nyata.",
			"Terima/tolak join hanya oleh ketua; konflik kapasitas memberi feedback tanpa kehilangan konteks.",
		],
		[
			"Anggota melihat daftar tim yang sah; keputusan ketua tercatat dan calon anggota diberi hasil.",
			"UI dan backend sama-sama menolak keputusan anggota biasa/ketua tim lain.",
		],
		[
			"Uji lintas role dan dua penerimaan kursi terakhir; count UI mengikuti hasil transaksi.",
		],
		"TEAM-02",
		"qZHSE",
	),
	make(
		"TEAM-04",
		"D3",
		"team",
		"Implementasikan keluar tim dan pemindahan ketua tanpa kehilangan riwayat",
		[
			"Dialog keluar, pilih ketua pengganti dan batas pengajuan aktif sesuai kebijakan.",
			"Cabut akses mantan anggota; pertahankan dokumen dan riwayat tim.",
		],
		[
			"Ketua tidak meninggalkan tim tanpa pemimpin saat anggota lain masih ada.",
			"Exit/transfer bersamaan menjaga keanggotaan konsisten; akses privat lama ditolak.",
		],
		[
			"Tes transaksi, hak akses sesudah keluar dan rollback kegagalan alih ketua.",
		],
		"TEAM-03 DEC-01",
	),

	make(
		"WORK-01",
		"D4",
		"documents",
		"Implementasikan Identitas Karya: judul, deskripsi, draf dan kelengkapan",
		[
			"Migrasi karya tim serta form Informasi Karya dan deep link pengisian dari Home.",
			"Simpan draf parsial, simpan tervalidasi, waktu/aktor pembaruan dan hak edit sesuai keputusan.",
		],
		[
			"Judul/deskripsi wajib untuk karya siap; draf tidak dianggap lengkap hanya karena ada file.",
			"Data milik tim dipakai ulang saat pengajuan; gagal simpan mempertahankan input.",
		],
		[
			"Tes validasi/draf, edit lintas role dan direct CTA ke field yang kurang.",
		],
		"TEAM-01 UI-03 DEC-01 DEC-02",
		"P8uOso",
	),
	make(
		"FILE-01",
		"D4",
		"security",
		"Siapkan Storage privat, metadata dokumen dan kebijakan akses",
		[
			"Migrasi dokumen, bucket privat, paths per tim dan policies berdasarkan keputusan akses.",
			"Unduh melalui otorisasi/signed URL terbatas; tetapkan validasi ukuran/tipe/kuota dan retensi.",
		],
		[
			"Anonymous, tim lain dan mentor tidak terkait tidak dapat membaca objek/metadata.",
			"Kebijakan server dan Storage sejalan; akses admin isi dokumen tidak diasumsikan otomatis.",
		],
		[
			"Tes RLS/Storage dengan JWT tiap role, URL kedaluwarsa, object path manipulasi dan pencabutan izin.",
		],
		"WORK-01 DEC-02 DEC-03",
	),
	make(
		"FILE-02",
		"D4",
		"documents",
		"Implementasikan upload, daftar, hapus dan pemulihan file gagal",
		[
			"Form upload, progress, retry, daftar metadata dan tindakan sesuai hak akses.",
			"Koordinasikan upload objek+metadata serta pembersihan objek yatim tanpa menghapus file tim lain.",
		],
		[
			"Jenis/ukuran/kuota dipaksa di server; submit berulang tidak menduplikasi dokumen.",
			"Hapus memerlukan konfirmasi; riwayat request tidak rusak dan dokumen terhapus dijelaskan.",
		],
		[
			"Simulasikan gagal jaringan/metadata/delete; tes file invalid, privasi dan retry.",
		],
		"FILE-01 UI-02",
		"P8uOso",
	),
	make(
		"FILE-03",
		"D4",
		"documents",
		"Implementasikan link Drive dan pelaporan bahan tidak dapat diakses",
		[
			"Tambah/edit/hapus link dokumen/folder dengan judul dan validasi URL aman.",
			"Instruksi izin Drive serta peringatan persisten bila mentor melaporkan akses gagal.",
		],
		[
			"Link tampil pada Identitas Karya dan review mentor yang berhak tanpa URL rekaan.",
			"Menyimpan link tidak diklaim memberi izin Google; revisi dapat memperbaiki link tanpa kehilangan konteks.",
		],
		[
			"Uji URL invalid/unsafe, izin role, kegagalan simpan dan alur laporan/perbaikan.",
		],
		"WORK-01 FILE-01",
		"P8uOso",
	),

	make(
		"MENTOR-01",
		"D5",
		"mentor",
		"Bangun model mentor independen dari akun dan kontak privat",
		[
			"Migrasi mentors/achievements/contacts dengan ID tetap dan auth account nullable.",
			"Pisahkan profil katalog dari kontak WhatsApp; tautkan akun terverifikasi melalui operasi admin.",
		],
		[
			"Admin dapat membuat mentor sebelum Google login pertama.",
			"Akun hanya dapat mengelola profil yang ditautkan; katalog/API tidak membocorkan kontak privat.",
		],
		[
			"Tes RLS, listing publik/authenticated, penautan salah akun dan revoke role.",
		],
		"AUTH-03 DEC-06",
	),
	make(
		"MENTOR-02",
		"D5",
		"mentor",
		"Impor sembilan mentor dan pemetaan foto secara idempoten",
		[
			"Seed dari JSON publik tanpa kontak; kontak asli diimpor privat bila diperlukan.",
			"Map foto eksplisit, Wildan inisial, ejaan Nauval terkonfirmasi dan batas Emirsyah 24 Oktober.",
		],
		[
			"Seed dua kali tidak menggandakan mentor/prestasi; tidak ada prestasi/foto rekaan.",
			"Pemetaan nama berkas Fanan dengan dua spasi benar dan seluruh portrait dapat dimuat.",
		],
		[
			"Validasi jumlah data, ID stabil, foto dan payload katalog bebas nomor privat.",
		],
		"MENTOR-01 DEC-07",
	),
	make(
		"MENTOR-03",
		"D5",
		"admin",
		"Implementasikan admin CRUD mentor, detail dan pengarsipan aman",
		[
			"Daftar/filter, tambah, detail, edit, aktif/nonaktif dan arsip mentor.",
			"Arsip menangani pengajuan/sesi aktif dan mencabut akses mentor tanpa menghapus riwayat.",
		],
		[
			"Seluruh operasi CRUD ditangani server dan diaudit; peserta/mentor lain tidak dapat memanggilnya.",
			"Mentor beraktivitas aktif tidak dihapus diam-diam; kontak privat hanya pada area admin yang sah.",
		],
		[
			"E2E CRUD, invalid input, arsip terblokir/aman, dan pemeriksaan riwayat/akses sesudah arsip.",
		],
		"MENTOR-02 UI-03 DES-02",
		"JN7g7 mhJ0T M7eio l49bN",
	),
	make(
		"SLOT-01",
		"D5",
		"booking",
		"Persistensikan settings dan slot dengan constraint waktu termasuk buffer",
		[
			"Migrasi settings/availabilities dan generator per mentor/tanggal memakai helper yang sudah ada.",
			"Timestamp UTC/tampilan WIB, snapshot durasi, pemeriksaan overlap, batas kegiatan dan hari mentor.",
		],
		[
			"Default 18.30–22.00 menghasilkan 10 slot, sesi terakhir 21.30–21.45 dan buffer sampai 21.50.",
			"Tidak ada slot parsial; perubahan settings tidak mengubah durasi booking historis.",
		],
		[
			"Tes database overlap/boundary, WIB, concurrent generation dan restricted date Emirsyah.",
		],
		"MENTOR-01 AUTH-01 DEC-07",
	),
	make(
		"SLOT-02",
		"D5",
		"admin",
		"Implementasikan admin editor jam operasional dan jadwal per mentor",
		[
			"Pilih mentor/tanggal, preview generator, tambah/edit/hapus slot belum terkonfirmasi.",
			"Admin dapat mengubah jam mulai/berakhir; sesi approved di luar rentang baru menjadi konflik untuk ditangani.",
		],
		[
			"Perubahan jam tidak menghapus/memindahkan booking secara otomatis.",
			"UI memberi alasan untuk overlap, waktu invalid, slot lampau dan larangan tanggal mentor.",
		],
		[
			"E2E settings/custom slots, preview, konflik sesi protected dan audit perubahan.",
		],
		"SLOT-01 UI-03",
		"wPzsM QzEN0",
	),
	make(
		"MENTOR-04",
		"D5",
		"mentor",
		"Implementasikan profil mandiri mentor dan editor ketersediaan",
		[
			"Foto/title mandiri sesuai batas kebijakan dan ketersediaan milik mentor.",
			"Penambahan/perubahan/penghapusan slot memakai aturan domain yang sama dengan admin.",
		],
		[
			"Mentor tidak dapat mengubah akun, role atau jadwal mentor lain lewat payload.",
			"Sesi approved terlindungi; gagal upload foto tidak merusak profil sebelumnya.",
		],
		[
			"Uji lintas mentor, invalid image, overlap dan perubahan sesi terkonfirmasi.",
		],
		"MENTOR-02 SLOT-01 UI-03",
		"WxXhm aDE31",
	),

	make(
		"BOOK-01",
		"D6",
		"participant",
		"Implementasikan katalog, detail mentor dan pemilihan jadwal nyata",
		[
			"Pencarian nama, filter bidang/tanggal, kartu tengah dan detail/profil/prestasi.",
			"Slot tersedia/dipilih/penuh/lewat, CTA ketua dan prasyarat tim tanpa menghalangi browsing.",
		],
		[
			"Filter 25 Oktober tidak menawarkan Emirsyah tersedia; seluruh waktu berlabel WIB dan sesi 15 menit.",
			"Loading/gagal/kosong mempertahankan filter; tidak ada topik diisi ulang pada langkah berikutnya.",
		],
		[
			"E2E filter, empty result, peran ketua/anggota dan slot berubah setelah dipilih.",
		],
		"MENTOR-02 SLOT-01 UI-03",
		"Sqq5i kw3pR",
	),
	make(
		"REQ-01",
		"D6",
		"booking",
		"Bangun skema request, snapshot karya dan state machine pengajuan",
		[
			"Migrasi request/documents/events dengan ownership tim dan snapshot versi karya.",
			"Validasi transisi serta batas aktif sesuai keputusan; simpan pelaku/waktu pada setiap aksi.",
		],
		[
			"Client tidak dapat membuat approved langsung atau mengganti tim/mentor tanpa otorisasi.",
			"Perubahan karya sesudah submit tidak diam-diam mengubah snapshot yang direview.",
		],
		[
			"Tes setiap transisi valid/invalid, RLS dan batas request pada dua transaksi bersamaan.",
		],
		"WORK-01 SLOT-01 DEC-04 DEC-03",
	),
	make(
		"REQ-02",
		"D6",
		"participant",
		"Implementasikan review dan submit pengajuan dengan idempotensi",
		[
			"Tampilkan mentor/slot, tim, karya tersimpan dan dokumen sebelum kirim.",
			"Deep link perbaikan karya lalu kembali, validasi ulang slot dan cegah submit ganda.",
		],
		[
			"Ketua sah dapat submit pending; anggota/pengguna tanpa tim tidak dapat melewati prasyarat via API.",
			"Retry menghasilkan satu request; pending dijelaskan belum mengunci jadwal.",
		],
		[
			"E2E submit sukses/gagal, double click, stale slot, karya belum lengkap dan unauthorized payload.",
		],
		"BOOK-01 REQ-01 FILE-02 FILE-03",
	),
	make(
		"REQ-03",
		"D6",
		"participant",
		"Implementasikan daftar aktif, riwayat dan detail pengajuan peserta",
		[
			"Aktif/Riwayat, filter, detail status, snapshot, dokumen, catatan dan riwayat event.",
			"Meeting hanya untuk approved dan pengguna yang berhak; data mengikuti akses tim yang disepakati.",
		],
		[
			"Tidak ada fixtures tim/tanggal desain menjadi data produksi; daftar tidak membocorkan tim lain.",
			"Empty/loading/gagal dan CTA berikutnya sesuai status tanpa timeline linear palsu.",
		],
		[
			"Uji ketua/anggota/tim lain, status, link file dan direct access ID request.",
		],
		"REQ-02 UI-03",
		"C7k5Y",
	),
	make(
		"REQ-04",
		"D6",
		"mentor",
		"Implementasikan review mentor dan keputusan dengan approval slot atomik",
		[
			"Daftar/detail pengajuan, akses karya/file dan form setujui/tolak/revisi.",
			"Approval+kunci slot+event/notifikasi atomik; yang kehilangan slot memerlukan revisi dengan alasan.",
		],
		[
			"Setujui membutuhkan meeting URL; tolak alasan; revisi catatan dan jenis.",
			"Dua approval pada slot sama tidak sama-sama berhasil; mentor lain tidak dapat memberi keputusan.",
		],
		[
			"Tes race approval, invalid transition/link, pembacaan file dan rollback transaksi gagal.",
		],
		"REQ-01 REQ-02 MENTOR-04",
		"xEVVX npffV TLHMy",
	),

	make(
		"LIFE-01",
		"D7",
		"booking",
		"Implementasikan revisi karya/dokumen dan kirim ulang pengajuan",
		[
			"Jenis revisi jelas, deep link ke input karya/dokumen dan kembali ke request.",
			"Kirim ulang memperbarui snapshot/versi dengan event lalu pending.",
		],
		[
			"Catatan mentor tetap dapat dibaca; perbaikan karya saja tidak otomatis mengirim ulang.",
			"Hanya pelaku sesuai kebijakan dapat kirim ulang; batas aktif tetap berlaku.",
		],
		[
			"E2E revisi dokumen/link, gagal simpan dan retry kirim ulang tanpa duplikasi.",
		],
		"REQ-03 REQ-04",
	),
	make(
		"LIFE-02",
		"D7",
		"booking",
		"Implementasikan usulan dan konfirmasi perubahan jadwal sesi",
		[
			"Pisahkan revisi waktu pending dari change proposal untuk sesi approved.",
			"Tampilkan lama/baru, terima/tolak, cek ulang slot dan pemindahan atomik termasuk benturan tim.",
		],
		[
			"Menolak/gagal konfirmasi mempertahankan booking lama dan meeting yang sah.",
			"Penerimaan usulan pending tidak otomatis approved; target yang direbut transaksi lain ditangani jelas.",
		],
		[
			"Tes race slot lama/baru, rejection, rollback, retries dan actor unauthorized.",
		],
		"LIFE-01 SLOT-02 DEC-04 DEC-05",
	),
	make(
		"LIFE-03",
		"D7",
		"booking",
		"Implementasikan pembatalan peserta dan pembatalan darurat admin",
		[
			"Dialog alasan, aturan batas waktu final dan pembatalan admin yang diaudit.",
			"Lepas slot, ubah status, event dan pemberitahuan dalam transaksi yang sama.",
		],
		[
			"Batas waktu WIB tepat sesuai keputusan; anggota biasa tidak mengambil aksi ketua.",
			"Cancel vs approve bersamaan tidak meninggalkan slot booked tanpa sesi sah.",
		],
		[
			"Tes sebelum/tepat/sesudah batas, cancel retry, concurrent approval dan audit darurat.",
		],
		"REQ-04 DEC-05",
	),
	make(
		"LIFE-04",
		"D7",
		"mentor",
		"Implementasikan sesi selesai dan pencabutan akses pasca-relasi",
		[
			"Mentor menandai sesi yang sudah berlangsung selesai.",
			"Terapkan kebijakan akses dokumen ketika rejected/cancelled/completed atau mentor diarsipkan.",
		],
		[
			"Sesi masa depan tidak ditandai selesai tanpa aturan yang sah; riwayat tetap tersimpan.",
			"Keputusan akses berlaku pada UI, query database dan unduh Storage.",
		],
		[
			"Uji role, waktu, state lifecycle dan signed URL/metadata setelah akses dicabut.",
		],
		"LIFE-03 DEC-03",
	),

	make(
		"HOME-01",
		"D8",
		"participant",
		"Integrasikan Home peserta V2 beserta seluruh kondisi dan deep link",
		[
			"Container Mentoring Saya, Tim Saya, Identitas Karya dan Cari Mentor memakai data nyata.",
			"Lengkapi kosong/draf/siap/pending/revisi/approved/rejected/anggota, Discord dan resource.",
		],
		[
			"Container tetap ada saat kosong; CTA langsung ke form/tindakan sesuai prasyarat.",
			"Checklist tidak memakai persentase rekaan; meeting approved dan tindakan ketua tampil sesuai hak.",
		],
		[
			"Screenshot delapan state desktop dan mobile, direct CTA, stale permission serta data akun nyata.",
		],
		"REQ-03 LIFE-01 TEAM-04 WORK-01 UI-04",
		"YZhiC pUV9g ZOXQe IjI5o uheHL XGqsv GCTeg piZB9 S5DZy mC3hr sXzFQ",
	),
	make(
		"HOME-02",
		"D8",
		"mentor",
		"Integrasikan Home mentor dengan sesi, antrean tindakan dan aktivitas",
		[
			"Sesi terdekat, request perlu keputusan, slot terbuka dan sesi berlangsung/selesai.",
			"CTA menuju detail/jadwal nyata dengan count dari query yang berotorisasi.",
		],
		[
			"Mentor hanya melihat relasinya sendiri dan tidak memiliki count fixtures.",
			"Empty/loading/gagal dan perubahan data setelah keputusan ditangani tanpa kehilangan filter.",
		],
		["Uji dua mentor, nol data, perubahan status dan desktop/mobile/collapse."],
		"REQ-04 LIFE-04 UI-03",
		"SLLdc",
	),
	make(
		"ADMIN-01",
		"D8",
		"admin",
		"Implementasikan dashboard admin dan monitoring operasional",
		[
			"Metrik nyata tim/mentor/status, sorotan konflik dan aktivitas terbaru.",
			"Operasional dengan filter tim/pengajuan dan tindakan dukungan yang sah.",
		],
		[
			"Angka dapat ditelusuri ke data dan rentang query; tidak ada contoh 24/9/6 menjadi nilai tetap.",
			"Metadata operasional tidak memberi akses isi dokumen jika kebijakan tidak mengizinkan.",
		],
		[
			"Verifikasi hitungan, filter/pagination, hak admin dan direct URL dari role lain.",
		],
		"REQ-04 LIFE-03 MENTOR-03 DES-02",
		"RyujH uksG7",
	),
	make(
		"ADMIN-02",
		"D8",
		"admin",
		"Implementasikan pengaturan Link Penting dan Discord",
		[
			"Daftar/edit URL dan label resmi yang dipakai login/Home dari satu sumber data.",
			"Validasi skema URL, aktif/nonaktif, gagal simpan dan audit perubahan.",
		],
		[
			"Empat link resmi dan Discord awal sesuai input; URL unsafe ditolak.",
			"Perubahan admin tercermin tanpa hardcode ganda; akses publik mengikuti keputusan.",
		],
		[
			"Uji validasi, role unauthorized, propagasi data dan state link belum diatur.",
		],
		"UI-04 AUTH-03 DEC-08",
		"i9cHC",
	),
	make(
		"ADMIN-03",
		"D8",
		"admin",
		"Implementasikan akun/peran dan audit administratif",
		[
			"Penautan/revoke mentor dan perubahan role terkontrol sesuai model yang disepakati.",
			"Audit aktor, waktu, alasan, objek dan perubahan penting dengan pagination/filter.",
		],
		[
			"Role tidak dapat diubah lewat metadata pengguna atau RPC tanpa izin.",
			"Arsip mentor, jadwal, pembatalan dan pengaturan tercatat; audit tidak dapat diedit akun biasa.",
		],
		[
			"Tes privilege escalation, revoke akses sesi lama, audit atomicity dan pembatasan data sensitif.",
		],
		"MENTOR-03 SLOT-02 LIFE-03 DES-02",
		"I4HDVW MkATB",
	),
	make(
		"NOTIF-01",
		"D8",
		"notifications",
		"Implementasikan notifikasi transaksional dan refresh data berotorisasi",
		[
			"Join/review, keputusan/revisi, perubahan jadwal dan pembatalan membuat event penerima yang benar.",
			"Read/unread, tujuan detail serta polling/subscription aman; perbarui state dashboard setelah aksi.",
		],
		[
			"Retry mutasi tidak menggandakan notifikasi; event tidak hilang saat transaksi sukses.",
			"Pengguna tidak menerima data privat pihak lain; objek yang aksesnya hilang memberi penjelasan.",
		],
		[
			"Tes penerima lintas role, deduplikasi, kegagalan transaksi dan hak subscription/read.",
		],
		"TEAM-03 REQ-04 LIFE-02",
	),

	make(
		"QA-01",
		"D9",
		"security",
		"Jalankan matriks RLS, Storage dan otorisasi seluruh role",
		[
			"Anonymous, ketua, anggota, tim lain, mentor terkait/tidak terkait, admin dan akun dicabut.",
			"Uji read/write/delete, role metadata, RPC, IDOR, path Storage dan URL kedaluwarsa.",
		],
		[
			"Tidak ada akses privat lintas tim atau eskalasi role; hasil uji terdokumentasi.",
			"Kebijakan admin/riwayat sesuai keputusan dan tidak hanya dibatasi oleh UI.",
		],
		[
			"Suite integrasi database nyata/uji yang dapat diulang; catat konfigurasi tanpa secret.",
		],
		"ADMIN-03 LIFE-04 FILE-02 NOTIF-01",
	),
	make(
		"QA-02",
		"D9",
		"qa",
		"Uji transaksi bersamaan, idempotensi dan pemulihan kegagalan",
		[
			"Dua join kursi terakhir, double submit, dua approval, cancel vs approve dan pindah slot.",
			"Kegagalan upload/metadata, notifikasi dan retry tidak meninggalkan keadaan parsial.",
		],
		[
			"Invariant kapasitas dan booking bertahan dengan minimal dua koneksi transaksi nyata.",
			"Tidak ada orphan tak tertangani atau notifikasi ganda; deadlock/retry memiliki hasil terkendali.",
		],
		[
			"Tes concurrency berulang dengan assertions akhir database, bukan mock query saja.",
		],
		"LIFE-02 LIFE-03 NOTIF-01 FILE-02",
	),
	make(
		"QA-03",
		"D9",
		"qa",
		"Bangun E2E alur inti lintas peserta, mentor dan admin",
		[
			"Login, tim, karya/file/Drive, katalog, submit, keputusan, revisi, reschedule dan selesai.",
			"CRUD mentor, settings, konflik, arsip, akun dan audit; pisahkan OAuth manual jika dibatasi Google.",
		],
		[
			"Satu alur lintas role lulus pada staging tanpa edit SQL manual untuk keputusan sehari-hari.",
			"Tes mempunyai fixtures aman, cleanup dan bukti hasil; stub dasar tidak dianggap fitur selesai.",
		],
		["Browser E2E pada environment uji, plus checklist OAuth akun nyata."],
		"HOME-01 HOME-02 ADMIN-01 ADMIN-02 ADMIN-03 NOTIF-01",
	),
	make(
		"QA-04",
		"D9",
		"qa",
		"Validasi visual, aksesibilitas dan ketahanan aplikasi",
		[
			"Bandingkan frame terpilih 1440/390 dan lebar di antaranya; keyboard/zoom/text panjang.",
			"Uji koneksi lambat, error/retry, refresh, query besar/pagination dan error boundary.",
		],
		[
			"Tidak ada clipping/overlap pada jalur utama; fokus/dialog/drawer terbaca dan dapat dioperasikan.",
			"Tidak ada fixture produksi, CTA palsu, kebocoran error/token atau cache data antar pengguna.",
		],
		[
			"Screenshot before/after, a11y keyboard, mobile dan smoke load dengan ukuran data representatif.",
		],
		"QA-03 DES-03",
	),

	make(
		"REL-01",
		"D10",
		"infra",
		"Siapkan CI dan staging dengan database/data uji terpisah",
		[
			"Workflow npm ci, lint, typecheck, unit dan build; integrasi memakai secret environment yang sah.",
			"Deploy staging dengan callback OAuth/origin yang benar serta migrasi terurut.",
		],
		[
			"PR memiliki pemeriksaan otomatis yang dapat diulang; lockfile dipakai.",
			"Staging tidak memakai peserta/file produksi; environment tidak masuk log atau artefak publik.",
		],
		["Uji satu PR gagal dan satu berhasil; smoke login/route di staging."],
		"AUTH-01 UI-03",
	),
	make(
		"REL-02",
		"D10",
		"infra",
		"Siapkan data produksi, migrasi dan deployment dengan rollback",
		[
			"Konfigurasi domain/HTTPS, OAuth, bucket/policies, admin serta akun mentor sah.",
			"Seed idempoten, jadwal aktual terkonfirmasi, backup/pemulihan dan urutan deploy kompatibel.",
		],
		[
			"Produksi tidak mengandung fixtures tim/meeting atau kontak privat pada katalog.",
			"Rollback aplikasi tidak merusak data; perubahan skema destruktif tidak dijalankan tanpa rencana.",
		],
		[
			"Dry run migrasi/restore sesuai kemampuan project dan smoke test pada akun/slot uji aman.",
		],
		"REL-01 QA-01 QA-02 QA-03 QA-04 DEC-07",
	),
	make(
		"REL-03",
		"D10",
		"docs",
		"Tulis runbook panitia dan prosedur dukungan acara",
		[
			"Panduan akun, mentor/jadwal, dokumen tak terbuka, keputusan, konflik dan pembatalan darurat.",
			"Tentukan penanggung jawab, log aman, pemantauan dan langkah pemulihan.",
		],
		[
			"Panitia dapat menjalankan operasi rutin tanpa mengubah SQL sembarang.",
			"Panduan membedakan bantuan admin dari kemampuan yang belum tersedia; tidak membagikan secret.",
		],
		[
			"Latihan skenario mentor berhalangan, akses Drive gagal dan peserta tidak bisa login.",
		],
		"ADMIN-01 ADMIN-03 REL-01",
	),
	make(
		"REL-04",
		"D10",
		"qa",
		"Lakukan UAT dan putuskan kesiapan rilis acara",
		[
			"Jalankan checklist penerimaan dengan panitia, mentor, ketua dan anggota.",
			"Catat penghambat, scope aktif/nonaktif, hasil smoke produksi dan keputusan rilis.",
		],
		[
			"Tidak ada issue akses/data/booking kritis terbuka pada scope yang diaktifkan.",
			"Tanggal acara bukan alasan menutup issue tanpa bukti; keterbatasan dinyatakan jelas.",
		],
		[
			"Lampirkan hasil UAT dan smoke test dengan data aman serta daftar issue sisa.",
		],
		"REL-02 REL-03",
	),

	make(
		"FUT-01",
		"FUTURE",
		"notifications",
		"Rancang pengingat email atau Discord sebelum sesi",
		[
			"Pilih kanal, consent, jadwal pengiriman, retry dan deduplikasi.",
			"Gunakan kanal transaksi yang disepakati, bukan menganggap link Discord mengirim pesan otomatis.",
		],
		[
			"Tidak ada pengiriman tanpa konfigurasi/persetujuan; perubahan sesi membatalkan pengingat lama.",
			"Token webhook/provider disimpan server dan kegagalan dipantau.",
		],
		["Uji waktu WIB, reschedule/cancel dan provider failure pada sandbox."],
		"REL-04 NOTIF-01",
	),
	make(
		"FUT-02",
		"FUTURE",
		"participant",
		"Tambahkan unduh kalender sesi yang terkonfirmasi",
		[
			"ICS atau integrasi kalender untuk jadwal approved dengan zona waktu benar.",
		],
		[
			"Informasi sesi benar dan hanya pengguna sah yang mengaksesnya.",
			"Perubahan/pembatalan tidak menyisakan informasi menyesatkan.",
		],
		["Uji import kalender dan waktu di beberapa timezone."],
		"REL-04 LIFE-02",
	),
	make(
		"FUT-03",
		"FUTURE",
		"product",
		"Rancang feedback peserta dan catatan hasil mentoring",
		[
			"Tentukan tujuan, akses, field dan retensi feedback/catatan sebelum membangun form.",
		],
		[
			"Hanya sesi selesai dan pelaku sah dapat memberi feedback sesuai kebijakan.",
			"Feedback tidak menjadi syarat pengajuan baru tanpa keputusan produk.",
		],
		["Uji role, sesi belum selesai, edit/duplikasi dan akses data sensitif."],
		"REL-04 LIFE-04",
	),
	make(
		"FUT-04",
		"FUTURE",
		"booking",
		"Rancang auto-expire pengajuan yang tidak direspons",
		[
			"Konfirmasi ambang 2×24 jam pada konteks acara dan aturan slot/notifikasi.",
			"Siapkan job idempoten dengan audit dan pemantauan.",
		],
		[
			"Tidak meng-expire approved atau menimpa keputusan bersamaan.",
			"Ambang dapat dijelaskan pengguna; job retry tidak membuat event ganda.",
		],
		["Tes boundary, keputusan concurrent, jam server dan pemulihan job gagal."],
		"REL-04 REQ-01",
	),
	make(
		"FUT-05",
		"FUTURE",
		"admin",
		"Rancang analitik dan ekspor operasional yang menjaga privasi",
		[
			"Tetapkan metrik, rentang laporan, format ekspor dan izin data yang diperlukan.",
		],
		[
			"Angka cocok dengan sumber transaksi dan tidak mengekspor file/kontak privat tanpa izin.",
			"Ekspor besar memiliki pembatasan dan audit yang sesuai.",
		],
		[
			"Uji hitungan, pagination, izin dan sanitasi formula CSV jika format tersebut dipilih.",
		],
		"REL-04 ADMIN-01",
	),
	make(
		"FUT-06",
		"FUTURE",
		"product",
		"Evaluasi undangan tim via kode dan multi-role switcher",
		[
			"Putuskan kebutuhan produk terpisah sebelum mengubah model role/keanggotaan.",
			"Rancang masa berlaku kode, revoke, kapasitas dan pemisahan konteks role.",
		],
		[
			"Kode tidak membypass batas tiga anggota atau keputusan join.",
			"Pergantian role tidak memberi akses lintas peran yang tidak ditugaskan.",
		],
		["Review threat model dan migrasi kompatibel sebelum implementasi."],
		"REL-04 DEC-01 DEC-06",
	),
];

export const allItems = [...decisions, ...tasks];

/** Memeriksa ID, kelengkapan dan dependensi backlog tanpa siklus. */
export function validateBacklog() {
	const byId = new Map(
		allItems.map(
			/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
			(item) => [item.id, item],
		),
	);
	if (byId.size !== allItems.length)
		throw new Error("Duplicate stable issue ID");
	const stageIds = new Set(
		stages.map(
			/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
			(stage) => stage.id,
		),
	);
	const done = new Set();
	const visiting = new Set();
	/** Menjalankan langkah visit sesuai tanggung jawab modul ini. */
	function visit(id) {
		if (visiting.has(id)) throw new Error(`Dependency cycle: ${id}`);
		if (done.has(id)) return;
		const item = byId.get(id);
		if (!item) throw new Error(`Unknown dependency: ${id}`);
		if (!stageIds.has(item.stage))
			throw new Error(`Unknown stage: ${item.stage}`);
		if (!item.acceptance.length || !item.verification.length)
			throw new Error(`Incomplete issue: ${id}`);
		visiting.add(id);
		item.dependencies.forEach(visit);
		visiting.delete(id);
		done.add(id);
	}
	for (const item of allItems) visit(item.id);
	return {
		stages: stages.length,
		decisions: decisions.length,
		tasks: tasks.length,
		total: allItems.length + stages.length + 1,
	};
}

if (process.argv.includes("--validate"))
	console.log(JSON.stringify(validateBacklog(), null, 2));
