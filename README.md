<!-- TODO: Perbarui status implementasi dan panduan konfigurasi setelah setiap fase selesai. -->
# ADIKARA Mentoring 2026

Next.js App Router + TypeScript untuk halaman dan logika server; Supabase untuk PostgreSQL, Auth Google, dan penyimpanan privat.

## Status saat ini

Fondasi awal, bukan aplikasi mentoring lengkap. Sudah disiapkan:

- Entrypoint login Google, callback PKCE, keluar, dan penyegaran sesi berbasis cookie.
- Pemeriksaan sesi/peran di server serta halaman dasar peserta, mentor, dan admin.
- Migrasi profil dengan RLS dan pemberian peran yang tidak mengikuti metadata pengguna.
- Pembentukan slot 15 menit + jeda 5 menit, default 18.30–22.00, beserta pengujian.

Halaman dasar belum mengikuti mockup pen.dev. Fitur tim, Identitas Karya, unggahan, booking atomik, keputusan mentor, dan CRUD admin belum diimplementasikan. Tidak ada database remote yang dibuat/diubah oleh scaffold ini.

## Menjalankan lokal

1. Gunakan Node.js 22 LTS atau versi yang didukung Next.js.
2. Jalankan `npm install` (atau `npm ci` jika lockfile sudah tersedia).
3. Salin `.env.example` menjadi `.env.local`, lalu isi URL project, publishable key Supabase, dan APP_URL lokal.
4. Terapkan migrasi fondasi ke project Supabase baru.
5. Jalankan `npm run dev` dan buka http://localhost:3000.

Tanpa konfigurasi Supabase, halaman publik tetap bisa dibuka tetapi login tidak aktif.

Pemeriksaan: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Struktur

- `src/app`: halaman, Server Actions, dan callback autentikasi.
- `src/lib/auth`: pemeriksaan identitas dan peran.
- `src/lib/supabase`: client server/browser dan validasi environment.
- `src/lib/mentoring`: aturan domain jadwal.
- `supabase/migrations`: perubahan database yang ditinjau sebelum diterapkan.
- `tests`: pemeriksaan aturan penting.
- `scripts/github`: manifest dan pemeliharaan backlog issues.
- `docs/github`: indeks nomor issue publik, tanpa dokumen sumber internal.

Nomor WhatsApp pada CSV mentor adalah data privat. Jangan menyalin CSV mentah ke `public/` atau mengirimkannya sebagai respons katalog.

PRD, planning internal, desain pen.dev/PDF, foto, seluruh aset sumber, dan data mentor tetap lokal sesuai batas publikasi pemilik. Repo publik hanya memuat kode dan workflow issues. Aset/dokumen privat untuk pekerjaan UI/seed perlu disediakan terpisah kepada kontributor yang berwenang; aplikasi fondasi ini tidak bergantung pada aset tersebut untuk build.

Untuk konfigurasi Supabase: buat project, aktifkan Google OAuth, daftarkan callback aplikasi `/auth/callback`, dan jalankan migrasi pada environment uji. Nilai environment yang dibutuhkan tercantum pada `.env.example`. Jangan gunakan secret/service-role key pada variabel NEXT_PUBLIC.

## Development by issues

Pekerjaan dipilih dari GitHub Issues sesuai prioritas dan dependensinya. Lihat `CONTRIBUTING.md` dan `docs/GitHub Backlog.md`. Fondasi yang sudah ada tidak berarti sebuah fitur selesai sebelum integrasi dan kriteria penerimaannya diuji.
