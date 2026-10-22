<!-- TODO: Perbarui panduan bila kebijakan password atau mekanisme Auth Supabase berubah. -->
# Reset password staf lokal

Alat ini menggunakan Admin API Supabase, bukan SQL langsung pada auth.users. Alat tidak membuat akun atau mengubah peran. Hanya akun admin atau mentor_general aktif yang bisa dipilih. Semua konfigurasi dibaca dari .env.local pada root project.

1. Isi SUPABASE_SECRET_KEY dengan secret server pada .env.local. Jangan gunakan NEXT_PUBLIC_ untuk secret, jangan masukkan secret ke Git, dan jangan aktifkan transkrip terminal saat menjalankan alat.
2. Jalankan PowerShell: `& ./scripts/auth/reset-staff-password.ps1`.
3. Masukkan email staf. Setelah pemeriksaan akun berhasil, ketik RESET.
4. Masukkan password baru dua kali. Input disembunyikan dan tidak disimpan ke file atau argumen command line.
5. Coba masuk melalui form staf aplikasi menggunakan password baru.

Reset dijalankan hanya setelah pengguna memasukkan password sendiri. Pemeriksaan tanpa perubahan tersedia melalui `node scripts/auth/reset-staff-password.mjs --check EMAIL_STAF`.

Gunakan secret hanya pada lingkungan lokal yang dipercaya. Supabase tetap memeriksa kebijakan password project. Alat tidak mencabut atau mengubah peran akun dan tidak menjanjikan semua access token lama langsung kedaluwarsa.
