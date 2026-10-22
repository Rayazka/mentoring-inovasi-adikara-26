<!-- TODO: Perbarui bukti uji hosted Supabase dan kontrak RPC saat controller produksi dihubungkan. -->
# SQL rilis ADIKARA 2026

## Pemasangan melalui SQL Editor

1. Buka project Supabase → SQL Editor → New query.
2. Salin seluruh isi `supabase/sql/00_install.sql`, lalu Run sekali.
3. Jalankan `supabase/sql/02_verify_install.sql`. Seluruh 17 tabel yang ditampilkan harus `rls_aktif=true`; bucket `team-documents` harus privat dengan batas 10485760 byte. RPC publik yang diperiksa harus `security_definer=false` dan `dapat_dipanggil_anon=false`.
4. Buat dua akun berbeda melalui Authentication → Users: admin pribadi dan mentor bersama. Kelola password melalui Supabase Auth, bukan INSERT ke auth.users atau SQL di repo.
5. Buka `supabase/sql/01_assign_staff_roles.sql`, ganti dua placeholder email, lalu jalankan. File ini menetapkan admin pertama dan Mentor General. Jangan menjalankannya sebelum akun dibuat.
6. Aktifkan provider Google dan callback URL untuk peserta sebelum menghubungkan login aplikasi.

`00_install.sql` sudah menggabungkan fondasi autentikasi, struktur database, dan perintah RPC. Jangan menjalankan file migrasi terpisah lagi setelah paket gabungan berhasil. Jangan memasukkan file folder `tests` ke project produksi.

Paket ditujukan untuk project baru atau project yang hanya menjalankan migrasi fondasi repository ini. Fondasi dilewati jika `public.profiles` sudah ada. Paket domain bersifat migrasi sekali jalan, bukan skrip reset atau skrip idempoten. Bila ada error, simpan pesan beserta nama langkah; jangan menghapus tabel atau mencoba ulang bagian secara acak. Tiap migrasi memakai transaksi, tetapi fondasi/core/commands berkomit terpisah.

Untuk Supabase CLI, gunakan file `migrations` secara berurutan dan jangan menjalankan paket SQL Editor pada project yang sama. Bangun ulang paket dengan `node supabase/scripts/build-sql-editor.mjs` setelah mengubah migrasi sumber.

## Peran dan kewenangan

| Peran profil | Hak operasional |
| --- | --- |
| participant | Tim sendiri, karya, bahan dan pengajuan; keputusan keanggotaan/pengajuan dibatasi ketua |
| mentor_general | Membaca data mentoring lintas tim dan dokumen yang sudah siap; tidak mendapat direktori email/profil peserta atau izin mutasi operasional |
| admin | CRUD mentor/slot/tautan, pengaturan acara, keputusan pengajuan, reschedule, pengelolaan tim/karya/dokumen dan akun |

Nilai enum lama `mentor` tetap ada untuk kompatibilitas migrasi, tetapi tidak mendapat akses operasional rilis ini. Gunakan `mentor_general` untuk akun bersama. Penetapan role selalu melalui jalur tepercaya; metadata OAuth tidak dapat menaikkan peran.

Mentor General bukan admin. Pencatatan aktivitas akun bersama tidak membuktikan individu yang memakai akun. Perubahan password tetap merupakan fitur Supabase Auth, terpisah dari RLS domain aplikasi.

## Struktur data

- `profiles`: identitas dasar dan peran; email tetap berada di `auth.users`.
- `event_settings`, `resource_links`: tanggal, jam, durasi/jeda, Discord dan tautan resmi.
- `teams`, `team_members`, `team_join_requests`: tim dan permintaan keanggotaan.
- `works`, `documents`: karya tim, metadata file dan Drive.
- `mentors`, `mentor_slots`: profil dan ketersediaan.
- `mentoring_requests`, `request_documents`, `request_events`: status, snapshot dan riwayat.
- `bookings`: reservasi terkonfirmasi dengan exclusion constraints mentor dan tim, termasuk jeda.
- `reschedule_proposals`: persetujuan jadwal pengganti tanpa melepas booking lama lebih dulu.
- `notifications`, `audit_events`: pemberitahuan pribadi dan jejak operasi.

Tidak ada tim, pengajuan, dokumen atau profil mentor nyata yang dimasukkan sebagai seed produksi. Admin menambahkan mentor yang sudah disetujui untuk ditampilkan. Hanya konfigurasi acara dan tautan yang diberikan pemilik yang diisi otomatis.

## Admin mengatur jadwal mentor

Admin dapat INSERT/UPDATE/DELETE `mentors`, `mentor_slots`, dan `resource_links`, serta UPDATE `event_settings` melalui klien bersesi admin. RLS menolak akun lain. Perubahan dicatat pada audit.

Default acara 24–25 Oktober 2026, 18.30–22.00 WIB, sesi 15 menit dan jeda 5 menit. Untuk setiap mentor, isi `available_dates`, lalu panggil `generate_mentor_slots(mentor_id, tanggal)`.

```sql
-- Ganti UUID dengan mentor yang sudah ditambahkan admin.
select public.generate_mentor_slots('UUID_MENTOR'::uuid, date '2026-10-24');
select public.generate_mentor_slots('UUID_MENTOR'::uuid, date '2026-10-25');
```

Generator membuat sepuluh slot mulai 18.30, 18.50, 19.10, 19.30, 19.50, 20.10, 20.30, 20.50, 21.10, 21.30. Tidak ada sesi parsial 21.50. Pemanggilan ulang melewati jam yang sudah ada; perubahan konfigurasi tidak otomatis menggeser slot/booking lama.

Slot baru disimpan dalam `timestamptz`; kirim offset `+07:00` dari controller. SQL memvalidasi jadwal terhadap zona Asia/Jakarta, tanggal mentor, jam acara dan durasi/jeda. Penghapusan slot yang sudah dirujuk pengajuan dibatasi foreign key; gunakan penonaktifan untuk slot belum terbooking atau alur reschedule/pembatalan untuk sesi terkonfirmasi. Riwayat tidak dihapus.

## Kontrak RPC aplikasi

Wrapper `public` memakai SECURITY INVOKER; implementasi berprivilege berada di `private`, memeriksa sesi/peran dan menggunakan search_path kosong. Jangan menambahkan `private` ke daftar Exposed schemas di pengaturan Data API.

| Fungsi | Pengguna dan tujuan |
| --- | --- |
| `create_team`, `update_team`, `search_teams` | Peserta/admin; proyeksi pencarian tidak membuka karya atau kontak tim lain |
| `request_team_join`, `review_team_join` | Permintaan peserta dan keputusan ketua/admin, kapasitas maksimal tiga |
| `admin_add_member`, `transfer_team_leader`, `leave_team` | Pengelolaan keanggotaan; admin dapat menentukan tim/anggota target |
| `save_work` | Anggota/admin; `p_draft=true` untuk isian parsial, false untuk karya lengkap |
| `reserve_document`, `update_document` | Anggota/admin; perubahan/hapus dibatasi pengunggah, ketua atau admin |
| `complete_document_upload` | Hanya service_role server setelah ukuran/jenis objek diverifikasi |
| `list_mentor_slots` | Peserta/staf; status terbooking lintas tim tanpa identitas tim lain |
| `submit_request`, `resubmit_request` | Ketua/admin; karya lengkap dan dokumen siap, snapshot disimpan atomik |
| `review_request` | Admin; approved/rejected/revision_requested, link HTTPS atau catatan sesuai keputusan |
| `cancel_request`, `complete_request` | Pembatalan ketua/admin; penyelesaian sesi oleh admin setelah sesi berakhir |
| `propose_reschedule`, `respond_reschedule` | Admin mengusulkan; ketua/admin menanggapi dan mengubah booking secara atomik |
| `generate_mentor_slots` | Admin membuat slot lengkap sesuai pengaturan saat ini |
| `admin_accounts`, `admin_set_account` | Admin mengelola identitas, peran dan status aktif; admin terakhir dilindungi |
| `mark_notifications_read` | Akun aktif menandai notifikasinya sendiri |

`submit_request` memerlukan `p_key` UUID dari controller yang dipakai ulang saat retry. Tim hanya boleh mempunyai satu pengajuan pending/revision_requested; sesi approved ditampilkan terpisah dan tidak boleh bentrok dengan sesi lain tim. Pending tidak membuat booking. Approval yang bentrok gagal tanpa mengubah status atau booking lain. Penolakan/revisi harus mempunyai alasan, dan revisi harus mempunyai jenis work/schedule/both. Pembatalan sesi approved oleh peserta dibatasi 24 jam; admin dapat membatalkan dengan alasan.

## Upload privat dan Google Drive

1. Server memverifikasi sesi anggota/admin dan validasi file.
2. Panggil `reserve_document` menggunakan sesi pengguna, simpan ID/path hasilnya. Kuota maksimal 10 MB/file, 10 file dan 50 MB/tim mencakup reservasi yang belum selesai.
3. Server mengunggah ke bucket privat `team-documents` menggunakan secret/service_role di server. Tidak ada policy INSERT/UPDATE/DELETE Storage untuk klien peserta atau akun mentor bersama.
4. Panggil `complete_document_upload` dari server. Ukuran dan MIME aktual harus cocok; sebelum itu objek tidak dapat dibaca melalui policy aplikasi.
5. Jika gagal, batalkan metadata melalui `update_document(...,p_delete=>true)` sebagai pengguna yang berhak dan bersihkan objek lewat Storage API server. Jangan menghapus baris storage.objects langsung untuk menghapus berkas fisik.
6. Unduhan memakai sesi pengguna yang berhak atau signed URL berumur pendek setelah server memeriksa izin terbaru. Jangan mengandalkan service_role untuk menentukan sendiri siapa yang boleh mengunduh.

Drive hanya menyimpan URL `https://drive.google.com/...` atau `https://docs.google.com/...`. SQL tidak memberikan izin Google otomatis; pengunggah tetap harus membagikan bahan kepada akun Google mentor/panitia yang dipakai. Penghapusan metadata bersifat soft delete untuk mempertahankan jejak pengajuan; akses Storage dicabut dan objek fisik dibersihkan server.

## Verifikasi pengembangan

`tests/local-bootstrap.sql` meniru sebagian schema auth/storage untuk PostgreSQL lokal, bukan instalasi layanan Supabase. `tests/release-smoke.sql` menguji akses tim, Mentor General, admin, anon, keanggotaan, keputusan, snapshot, reschedule dan validasi metadata Storage, lalu rollback fixture.

`tests/release-concurrency.mjs` menjalankan koneksi bersamaan untuk kursi anggota terakhir dan dua approval slot sama. Jalankan hanya pada database lokal sekali pakai dengan `ADIKARA_SQL_TEST=1` dan `ADIKARA_TEST_DATABASE` berakhiran `_test`. Server uji memakai loopback port 55439; `ADIKARA_PSQL` dapat mengubah lokasi executable psql. Fixture tanggal memakai 24 Oktober 2026 dan harus masih di masa depan saat uji booking dijalankan.

Pengujian lokal membuktikan sintaks dan perilaku PostgreSQL yang diuji, bukan keberhasilan OAuth, upload hosted Storage, pengiriman email atau integrasi UI. Aplikasi saat ini masih memakai mode demo; controller produksi dan guard peran `mentor_general` harus dihubungkan sebelum dipakai peserta sungguhan.

## Sumber teknis

- [Supabase — Database Functions](https://supabase.com/docs/guides/database/functions)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase — Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)
- [PostgreSQL — Range Constraints](https://www.postgresql.org/docs/current/rangetypes.html)
