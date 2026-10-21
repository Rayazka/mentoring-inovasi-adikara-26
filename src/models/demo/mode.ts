// TODO: Hapus mode demo hanya setelah integrasi autentikasi dan database siap diuji.
/** Menjaga seluruh alur demo terpisah dari layanan produksi secara bawaan. */
export function isDemoMode() {
	return process.env.NEXT_PUBLIC_APP_MODE !== "connected";
}
