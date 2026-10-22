// TODO: Gunakan tipe hasil generated dan pertahankan pembacaan riwayat dokumen yang telah dicabut aksesnya.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requestStatuses, type OperationalStatus } from "./operations";
import type {
	ParticipantRequest,
	ParticipantRequestFilters,
	RequestDocumentSnapshot,
	RequestEvent,
} from "./request";
const columns =
	"id,code,status,team_id,mentor_id,slot_id,title_snapshot,description_snapshot,meeting_url,decision_note,revision_kind,created_at,team:teams(name),mentor:mentors(name,expertise,photo_url),slot:mentor_slots(starts_at,ends_at),booking:bookings(starts_at,ends_at,active)";

/** Menghitung status seluruh pengajuan tim tanpa terpengaruh batas pagination halaman daftar. */
export async function readTeamRequestCounts(
	client: SupabaseClient,
	teamId: string,
): Promise<Record<OperationalStatus, number>> {
	const results = await Promise.all(
		requestStatuses.map(
			/** Meminta hitungan pasti satu status dalam cakupan tim dan sesi pengguna. */
			async function count(status) {
				const result = await client
					.from("mentoring_requests")
					.select("id", { head: true, count: "exact" })
					.eq("team_id", teamId)
					.eq("status", status);
				if (result.error) throw new Error("Ringkasan pengajuan gagal dibaca.");
				return [status, result.count ?? 0];
			},
		),
	);
	return Object.fromEntries(results) as Record<OperationalStatus, number>;
}
/** Membaca pengajuan aktif atau riwayat tim dengan filter server dan pagination. */
export async function readParticipantRequests(
	client: SupabaseClient,
	teamId: string,
	filters: ParticipantRequestFilters,
) {
	let query = client
		.from("mentoring_requests")
		.select(columns, { count: "exact" })
		.eq("team_id", teamId)
		.in(
			"status",
			filters.tab === "active"
				? ["pending", "revision_requested", "approved"]
				: ["completed", "rejected", "cancelled"],
		)
		.order("created_at", { ascending: false });
	if (filters.status) query = query.eq("status", filters.status);
	if (filters.query) query = query.ilike("code", `%${filters.query}%`);
	const result = await query.range(
		(filters.page - 1) * 20,
		filters.page * 20 - 1,
	);
	if (result.error) throw new Error("Daftar pengajuan gagal dibaca.");
	return {
		items: (result.data ?? []) as unknown as ParticipantRequest[],
		total: result.count ?? 0,
	};
}
/** Memeriksa identitas tim secara eksplisit selain RLS untuk direct URL detail pengajuan. */
export async function readParticipantRequest(
	client: SupabaseClient,
	teamId: string,
	id: string,
): Promise<ParticipantRequest | null> {
	const result = await client
		.from("mentoring_requests")
		.select(columns)
		.eq("team_id", teamId)
		.eq("id", id)
		.maybeSingle();
	if (result.error) throw new Error("Pengajuan gagal dibaca.");
	return result.data as unknown as ParticipantRequest | null;
}
/** Membaca bahan yang dipilih saat pengajuan, bukan seluruh bahan tim yang ditambahkan kemudian. */
export async function readRequestDocumentSnapshots(
	client: SupabaseClient,
	id: string,
): Promise<RequestDocumentSnapshot[]> {
	const result = await client
		.from("request_documents")
		.select(
			"document_id,title_snapshot,document:documents(id,team_id,title,kind,drive_url,filename,bytes,ready,inaccessible,uploaded_by)",
		)
		.eq("request_id", id);
	if (result.error) throw new Error("Bahan pengajuan gagal dibaca.");
	return (result.data ?? []) as unknown as RequestDocumentSnapshot[];
}
/** Membaca jejak keputusan sebenarnya tanpa membuat timeline linear dari status akhir. */
export async function readRequestEvents(
	client: SupabaseClient,
	id: string,
): Promise<RequestEvent[]> {
	const result = await client
		.from("request_events")
		.select("id,action,note,created_at")
		.eq("request_id", id)
		.order("created_at");
	if (result.error) throw new Error("Riwayat pengajuan gagal dibaca.");
	return result.data ?? [];
}
