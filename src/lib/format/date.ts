// TODO: Pertahankan pemformatan tanggal netral agar aman dipakai komponen server maupun client.
/** Memformat tanggal atau waktu ISO dalam zona WIB untuk seluruh tampilan aplikasi. */
export function formatDate(value: string, withTime = false) {
	return (
		new Intl.DateTimeFormat("id-ID", {
			timeZone: "Asia/Jakarta",
			day: "numeric",
			month: "short",
			year: "numeric",
			...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
		}).format(
			new Date(value.includes("T") ? value : `${value}T12:00:00+07:00`),
		) + (withTime ? " WIB" : "")
	);
}
