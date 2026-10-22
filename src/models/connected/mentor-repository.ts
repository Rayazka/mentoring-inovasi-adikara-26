// TODO: Ganti cast hasil daftar dengan tipe Supabase generated setelah skema final.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventSettings } from "./operations";
import type { PublicMentor, AvailableSlot, CatalogFilters } from "./mentor";
const mentorColumns =
	"id,name,title,expertise,bio,photo_url,active,archived,available_dates,achievements";

/** Membaca pengaturan waktu acara yang menjadi sumber tanggal dan durasi pada UI. */
export async function readEventSettings(
	client: SupabaseClient,
): Promise<EventSettings> {
	const { data, error } = await client
		.from("event_settings")
		.select(
			"dates,day_start,day_end,session_minutes,buffer_minutes,discord_url",
		)
		.eq("singleton", true)
		.single();
	if (error || !data) throw new Error("Pengaturan acara gagal dibaca.");
	return data;
}
/** Menyaring mentor aktif melalui server tanpa memakai fixtures atau direktori kontak pribadi. */
export async function readMentorCatalog(
	client: SupabaseClient,
	filters: CatalogFilters,
) {
	let query = client
		.from("mentors")
		.select(mentorColumns, { count: "exact" })
		.eq("active", true)
		.eq("archived", false)
		.order("name");
	if (filters.query) query = query.ilike("name", `%${filters.query}%`);
	if (filters.expertise) query = query.eq("expertise", filters.expertise);
	if (filters.date) query = query.contains("available_dates", [filters.date]);
	const { data, error, count } = await query.range(
		(filters.page - 1) * 24,
		filters.page * 24 - 1,
	);
	if (error) throw new Error("Katalog mentor gagal dibaca.");
	return { mentors: (data ?? []) as PublicMentor[], total: count ?? 0 };
}
/** Membaca satu profil aktif sehingga direct URL tidak membuka mentor yang diarsipkan. */
export async function readPublicMentor(
	client: SupabaseClient,
	id: string,
): Promise<PublicMentor | null> {
	const { data, error } = await client
		.from("mentors")
		.select(mentorColumns)
		.eq("id", id)
		.eq("active", true)
		.eq("archived", false)
		.maybeSingle();
	if (error) throw new Error("Profil mentor gagal dibaca.");
	return data;
}
/** Membaca slot dan status terbooking melalui proyeksi aman RPC, bukan booking tim lain. */
export async function readAvailableSlots(
	client: SupabaseClient,
	mentorId: string,
	date: string,
): Promise<AvailableSlot[]> {
	const { data, error } = await client.rpc("list_mentor_slots", {
		p_mentor: mentorId,
		p_date: date,
	});
	if (error) throw new Error("Jadwal mentor gagal dibaca.");
	return data ?? [];
}
