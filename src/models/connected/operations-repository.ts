// TODO: Pertahankan query dengan sesi pengguna dan RLS; jangan gunakan secret admin pada halaman produk.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
	requestStatuses,
	type StaffSummary,
	type PageFilters,
	type OperationalRequest,
	type UpcomingBooking,
	type AuditEntry,
	type EventSettings,
	type MentorRecord,
	type ScheduleRecord,
	type TeamRecord,
	type DocumentRecord,
} from "./operations";
export const PAGE_SIZE = 20;
const requestColumns =
	"id,code,status,team_id,mentor_id,title_snapshot,description_snapshot,meeting_url,decision_note,created_at,team:teams(name),mentor:mentors(name),slot:mentor_slots(starts_at,ends_at)";

/** Menolak kegagalan query tanpa membocorkan detail database kepada browser. */
function assertQuery(result: { error: unknown }) {
	if (result.error) throw new Error("Data operasional belum berhasil dimuat.");
}
/** Memetakan hasil query sesuai kontrak SQL yang dipelihara aplikasi. */
function rows<T>(result: { data: unknown; error: unknown }): T[] {
	assertQuery(result);
	return (result.data ?? []) as T[];
}
/** Memuat hitungan pasti seluruh data dalam cakupan RLS sesi staf. */
async function count(
	query: PromiseLike<{ count: number | null; error: unknown }>,
) {
	const result = await query;
	assertQuery(result);
	return result.count ?? 0;
}

/** Membaca ringkasan dan daftar terbatas dengan query paralel tanpa mengunduh seluruh tabel. */
export async function readStaffSummary(
	client: SupabaseClient,
	admin: boolean,
): Promise<StaffSummary> {
	const now = new Date().toISOString();
	const [
		teams,
		mentors,
		slots,
		documents,
		statusCounts,
		requests,
		upcoming,
		audit,
		settings,
	] = await Promise.all([
		count(
			client
				.from("teams")
				.select("id", { count: "exact", head: true })
				.eq("archived", false),
		),
		count(
			client
				.from("mentors")
				.select("id", { count: "exact", head: true })
				.eq("active", true)
				.eq("archived", false),
		),
		count(
			client
				.from("mentor_slots")
				.select("id", { count: "exact", head: true })
				.eq("enabled", true)
				.gte("starts_at", now),
		),
		count(
			client
				.from("documents")
				.select("id", { count: "exact", head: true })
				.eq("ready", true)
				.is("deleted_at", null),
		),
		Promise.all(
			requestStatuses.map(
				/** Mengambil hitungan setiap status tanpa batas baris hasil select. */
				async function countStatus(status) {
					return [
						status,
						await count(
							client
								.from("mentoring_requests")
								.select("id", { count: "exact", head: true })
								.eq("status", status),
						),
					] as const;
				},
			),
		),
		client
			.from("mentoring_requests")
			.select(requestColumns)
			.order("created_at", { ascending: false })
			.limit(6),
		client
			.from("bookings")
			.select(
				"request_id,starts_at,ends_at,team:teams(name),mentor:mentors(name),request:mentoring_requests(code,meeting_url)",
			)
			.eq("active", true)
			.gte("starts_at", now)
			.order("starts_at")
			.limit(5),
		admin
			? client
					.from("audit_events")
					.select("id,action,entity,entity_id,created_at")
					.order("created_at", { ascending: false })
					.limit(5)
			: Promise.resolve({ data: [], error: null }),
		client
			.from("event_settings")
			.select(
				"dates,day_start,day_end,session_minutes,buffer_minutes,discord_url",
			)
			.eq("singleton", true)
			.single(),
	]);
	assertQuery(settings);
	if (!settings.data) throw new Error("Pengaturan acara belum tersedia.");
	return {
		teams,
		mentors,
		slots,
		documents,
		statuses: Object.fromEntries(statusCounts) as StaffSummary["statuses"],
		requests: rows<OperationalRequest>(requests),
		upcoming: rows<UpcomingBooking>(upcoming),
		audit: rows<AuditEntry>(audit),
		settings: settings.data as EventSettings,
		updatedAt: now,
	};
}

/** Membaca pengajuan dengan filter server dan jumlah baris pasti untuk pagination. */
export async function readRequests(
	client: SupabaseClient,
	filters: PageFilters,
) {
	let query = client
		.from("mentoring_requests")
		.select(requestColumns, { count: "exact" })
		.order("created_at", { ascending: false });
	if (filters.status) query = query.eq("status", filters.status);
	if (filters.query) query = query.ilike("code", `%${filters.query}%`);
	const result = await query.range(
		(filters.page - 1) * PAGE_SIZE,
		filters.page * PAGE_SIZE - 1,
	);
	return { items: rows<OperationalRequest>(result), total: result.count ?? 0 };
}
/** Membaca detail pengajuan hanya dalam cakupan RLS pengguna terverifikasi. */
export async function readRequest(client: SupabaseClient, id: string) {
	const result = await client
		.from("mentoring_requests")
		.select(requestColumns)
		.eq("id", id)
		.maybeSingle();
	assertQuery(result);
	return result.data as OperationalRequest | null;
}
/** Membaca profil mentor dengan pencarian dan pagination server. */
export async function readMentors(
	client: SupabaseClient,
	filters: PageFilters,
) {
	let query = client
		.from("mentors")
		.select(
			"id,name,title,expertise,bio,photo_url,active,archived,available_dates",
			{ count: "exact" },
		)
		.order("name");
	if (filters.query) query = query.ilike("name", `%${filters.query}%`);
	const result = await query.range(
		(filters.page - 1) * PAGE_SIZE,
		filters.page * PAGE_SIZE - 1,
	);
	return { items: rows<MentorRecord>(result), total: result.count ?? 0 };
}
/** Membaca jadwal seluruh mentor tanpa mengambil keputusan atau mengubah slot. */
export async function readSchedules(
	client: SupabaseClient,
	filters: PageFilters,
) {
	const result = await client
		.from("mentor_slots")
		.select(
			"id,starts_at,ends_at,buffer_ends_at,enabled,mentor:mentors(name)",
			{ count: "exact" },
		)
		.order("starts_at")
		.range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1);
	return { items: rows<ScheduleRecord>(result), total: result.count ?? 0 };
}
/** Membaca identitas karya melalui tim, termasuk tim yang belum mengisi karya. */
export async function readTeams(client: SupabaseClient, filters: PageFilters) {
	let query = client
		.from("teams")
		.select(
			"id,name,category,description,archived,work:works(title,description,is_draft)",
			{ count: "exact" },
		)
		.eq("archived", false)
		.order("name");
	if (filters.query) query = query.ilike("name", `%${filters.query}%`);
	const result = await query.range(
		(filters.page - 1) * PAGE_SIZE,
		filters.page * PAGE_SIZE - 1,
	);
	return { items: rows<TeamRecord>(result), total: result.count ?? 0 };
}
/** Membaca metadata dokumen tim yang belum dihapus menggunakan aturan akses database. */
export async function readTeamDocuments(
	client: SupabaseClient,
	teamId: string,
) {
	const result = await client
		.from("documents")
		.select("id,title,kind,filename,drive_url,ready,inaccessible")
		.eq("team_id", teamId)
		.is("deleted_at", null)
		.order("created_at", { ascending: false });
	return rows<DocumentRecord>(result);
}
/** Membaca audit hanya setelah controller memverifikasi peran admin. */
export async function readAudit(client: SupabaseClient, filters: PageFilters) {
	const result = await client
		.from("audit_events")
		.select("id,action,entity,entity_id,created_at", { count: "exact" })
		.order("created_at", { ascending: false })
		.range((filters.page - 1) * PAGE_SIZE, filters.page * PAGE_SIZE - 1);
	return { items: rows<AuditEntry>(result), total: result.count ?? 0 };
}
