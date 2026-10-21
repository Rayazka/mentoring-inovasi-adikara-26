<!-- TODO: Keep contribution guidance aligned with the current demo scope and production gates. -->
# Development by issues

## Aturan implementasi saat ini

- Gunakan MVC: model untuk data/invariant, controller untuk use case/validasi/otorisasi, view untuk presentasi; route Next.js menjadi adapter tipis.
- Kerjakan satu issue, verifikasi, commit dan push sebelum memulai issue berikutnya.
- Beri header komentar TODO pada file kode dan komentar tujuan di atas setiap fungsi. Format tanpa dukungan komentar, seperti JSON/generated/binary, harus tetap valid; catatan pemeliharaannya berada di dokumentasi pendamping.
- Tahap saat ini memakai data dummy dan login demo tanpa Google. Jangan menutup pekerjaan integrasi OAuth/RLS/database hanya berdasarkan demo lokal.
- Aturan lokal rinci berada di AGENTS.md yang sengaja diabaikan Git. PRD/desain/foto/aset tetap privat.

1. Pilih issue implementasi yang dependensi serta keputusan produknya sudah diselesaikan. Epic adalah pelacak kelompok pekerjaan, bukan satu PR besar.
2. Tulis komentar singkat tentang lingkup yang akan dikerjakan. Gunakan branch `feat/<nomor>-<ringkasan>`, `fix/<nomor>-<ringkasan>`, atau `docs/<nomor>-<ringkasan>`.
3. Ikuti PRD terbaru, frame desain yang dipilih, dan acceptance criteria issue. Kebijakan yang masih berlabel keputusan tidak boleh dianggap disetujui.
4. Implementasikan UI, server/database, validasi, otorisasi, serta kondisi gagal yang relevan dalam satu perubahan yang dapat ditinjau.
5. Jalankan `npm ci`, lint, typecheck, test, dan build sesuai perubahan. Integrasi OAuth, RLS, Storage dan race condition harus diuji pada environment uji yang sesuai; jangan mengklaim unit test membuktikan semuanya.
6. Buat PR dengan `Closes #<nomor>` hanya jika seluruh lingkup issue selesai. Jika baru sebagian, gunakan `Refs #<nomor>` dan tulis sisa pekerjaan.
7. Sertakan bukti pengujian dan screenshot desktop/mobile untuk UI. Untuk migrasi jelaskan dampak data, urutan penerapan, dan pemulihan bila gagal.
8. Jangan commit `.env.local`, secret key, kontak privat mentor, atau fixtures peserta nyata. Jangan memakai data contoh desain sebagai fallback produksi.
9. Epic/roadmap ditutup setelah seluruh anak yang termasuk scope rilis telah selesai dan bukti penerimaan tersedia. Fitur P2 tetap backlog sampai dijadwalkan.

## Definisi selesai

Acceptance criteria terpenuhi, dependensi teratasi, jalur kosong/loading/gagal tersedia, otorisasi ditegakkan di server/database, tes sesuai risiko lulus, dan dokumentasi relevan diperbarui. Tampilan harus mengikuti referensi desain terbaru, bukan hanya memiliki komponen serupa.
