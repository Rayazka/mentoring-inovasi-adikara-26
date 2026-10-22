// TODO: Pertahankan prioritas sesi mendatang dan pengajuan berjalan tanpa mengambil seluruh riwayat tim.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readParticipantRequest } from "./request-repository";

/** Membaca tautan penting aktif sesuai urutan pengaturan admin. */
export async function readHomeResources(client: SupabaseClient) {
	const { data, error } = await client
		.from("resource_links")
		.select("id,title,url,active")
		.eq("active", true)
		.order("sort_order");
	if (error) throw new Error("Tautan penting gagal dibaca.");
	return data ?? [];
}
/** Memilih sesi terkonfirmasi terdekat, lalu pengajuan berjalan, lalu riwayat terakhir. */
export async function readHomeRequests(client: SupabaseClient, teamId: string) {
	const [booking, ongoing, latest] = await Promise.all([
		client
			.from("bookings")
			.select("request_id")
			.eq("team_id", teamId)
			.eq("active", true)
			.gt("ends_at", new Date().toISOString())
			.order("starts_at")
			.limit(1)
			.maybeSingle(),
		client
			.from("mentoring_requests")
			.select("id,status")
			.eq("team_id", teamId)
			.in("status", ["pending", "revision_requested"])
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle(),
		client
			.from("mentoring_requests")
			.select("id")
			.eq("team_id", teamId)
			.order("created_at", { ascending: false })
			.limit(1)
			.maybeSingle(),
	]);
	if (booking.error || ongoing.error || latest.error)
		throw new Error("Ringkasan mentoring gagal dibaca.");
	const id = booking.data?.request_id ?? ongoing.data?.id ?? latest.data?.id;
	return {
		request: id ? await readParticipantRequest(client, teamId, id) : null,
		attention:
			booking.data && ongoing.data
				? ongoing.data.status === "revision_requested"
					? "Ada pengajuan lain yang memerlukan revisi. Buka Pengajuan Mentoring untuk menindaklanjuti."
					: "Ada pengajuan lain yang masih menunggu keputusan admin."
				: "",
	};
}
