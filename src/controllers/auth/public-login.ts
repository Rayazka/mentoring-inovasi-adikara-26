// TODO: Pertahankan proyeksi publik saat struktur acara berubah.
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ResourceLink } from "@/models/demo/types";
/** Membaca informasi publik yang diizinkan RLS tanpa menggunakan fixtures. */
export async function getPublicLoginData(configured: boolean) {
	let resources: ResourceLink[] = [];
	let dateLabel = "Jadwal mentoring akan diumumkan";
	if (configured) {
		const supabase = await createClient();
		const [links, settings] = await Promise.all([
			supabase
				.from("resource_links")
				.select("id,title,url,active")
				.eq("active", true)
				.order("sort_order"),
			supabase
				.from("event_settings")
				.select("dates")
				.eq("singleton", true)
				.single(),
		]);
		resources = links.data ?? [];
		const dates: string[] = settings.data?.dates ?? [];
		if (dates.length)
			dateLabel = dates
				.map(
					/** Menampilkan tanggal acara publik dalam zona waktu Jakarta. */
					function formatDate(date) {
						return new Intl.DateTimeFormat("id-ID", {
							day: "numeric",
							month: "long",
							year: "numeric",
							timeZone: "Asia/Jakarta",
						}).format(new Date(`${date}T12:00:00+07:00`));
					},
				)
				.join(" & ");
	}
	return { resources, dateLabel };
}
