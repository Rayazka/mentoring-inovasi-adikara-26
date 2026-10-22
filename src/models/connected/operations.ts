// TODO: Ganti pemetaan respons dengan tipe database terbangkitkan setelah kontrak SQL stabil.
import type { StaffRole } from "./staff";
export const requestStatuses = [
	"pending",
	"revision_requested",
	"approved",
	"rejected",
	"cancelled",
	"completed",
] as const;
export type OperationalStatus = (typeof requestStatuses)[number];
export type Relation<T> = T | T[] | null;
export interface NamedRelation {
	name: string;
}
export interface OperationalRequest {
	id: string;
	code: string;
	status: OperationalStatus;
	team_id: string;
	mentor_id: string;
	title_snapshot: string;
	description_snapshot: string;
	meeting_url: string | null;
	decision_note: string;
	created_at: string;
	team: Relation<NamedRelation>;
	mentor: Relation<NamedRelation>;
	slot: Relation<{ starts_at: string; ends_at: string }>;
}
export interface UpcomingBooking {
	request_id: string;
	starts_at: string;
	ends_at: string;
	team: Relation<NamedRelation>;
	mentor: Relation<NamedRelation>;
	request: Relation<{ code: string; meeting_url: string | null }>;
}
export interface AuditEntry {
	id: string;
	action: string;
	entity: string;
	entity_id: string;
	created_at: string;
}
export interface EventSettings {
	dates: string[];
	day_start: string;
	day_end: string;
	session_minutes: number;
	buffer_minutes: number;
	discord_url: string;
}
export interface StaffSummary {
	teams: number;
	mentors: number;
	slots: number;
	documents: number;
	statuses: Record<OperationalStatus, number>;
	requests: OperationalRequest[];
	upcoming: UpcomingBooking[];
	audit: AuditEntry[];
	settings: EventSettings;
	updatedAt: string;
}
export interface PageFilters {
	page: number;
	query: string;
	status: OperationalStatus | "";
}
export interface MentorRecord {
	id: string;
	name: string;
	title: string;
	expertise: string;
	bio: string;
	photo_url: string | null;
	active: boolean;
	archived: boolean;
	available_dates: string[];
}
export interface ScheduleRecord {
	id: string;
	starts_at: string;
	ends_at: string;
	buffer_ends_at: string;
	enabled: boolean;
	mentor: Relation<NamedRelation>;
}
export interface TeamRecord {
	id: string;
	name: string;
	category: string;
	description: string;
	archived: boolean;
	work: Relation<{ title: string; description: string; is_draft: boolean }>;
}
export interface DocumentRecord {
	id: string;
	title: string;
	kind: "file" | "drive";
	filename: string | null;
	drive_url: string | null;
	ready: boolean;
	inaccessible: boolean;
}

/** Menormalkan relasi PostgREST tunggal tanpa menebak data saat relasi tidak tersedia. */
export function relationValue<T>(relation: Relation<T>): T | null {
	return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}
/** Menjaga filter query tetap terbatas dan pagination tidak menghasilkan nilai invalid. */
export function parsePageFilters(input: Record<string, unknown>): PageFilters {
	const page = typeof input.page === "string" ? Number(input.page) : 1;
	return {
		page: Number.isInteger(page) && page >= 1 ? Math.min(page, 5000) : 1,
		query: (typeof input.q === "string" ? input.q : "").trim().slice(0, 80),
		status: requestStatuses.includes(input.status as OperationalStatus)
			? (input.status as OperationalStatus)
			: "",
	};
}
/** Menentukan direktori operasional berdasarkan peran terverifikasi. */
export function staffBase(role: StaffRole) {
	return role === "admin" ? "/admin" : "/mentor";
}
/** Menghitung total pengajuan dari seluruh kelompok status, termasuk riwayat. */
export function totalRequests(summary: StaffSummary) {
	return requestStatuses.reduce(
		/** Menambahkan hitungan status yang berasal dari count database. */
		function sum(total, status) {
			return total + summary.statuses[status];
		},
		0,
	);
}
/** Menyajikan tanggal dan jam di zona waktu acara, bukan zona waktu browser. */
export function formatWib(value: string, withTime = true) {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Jadwal belum tersedia";
	return (
		new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "short",
			year: "numeric",
			...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
			timeZone: "Asia/Jakarta",
		}).format(date) + (withTime ? " WIB" : "")
	);
}
