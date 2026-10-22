// TODO: Pertahankan demo sebagai pilihan eksplisit agar deployment tidak memakai fixtures tanpa sengaja.
/** Mengaktifkan demo hanya jika environment secara eksplisit memilih data lokal. */
export function isDemoMode() {
	return process.env.NEXT_PUBLIC_APP_MODE === "demo";
}
