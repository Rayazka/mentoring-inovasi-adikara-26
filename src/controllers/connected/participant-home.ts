// TODO: Pertahankan pemetaan data produksi ke kontrak presentasi Home V2 tanpa fixtures.
import "server-only";
import { requireSession } from "@/lib/auth/session";
import type { ParticipantHomeViewModel } from "@/models/participant-home";
import {
	readParticipantTeam,
	readTeamMembers,
	readIncomingJoins,
} from "@/models/connected/team-repository";
import { readTeamWork } from "@/models/connected/work-repository";
import { isConnectedWorkReady } from "@/models/connected/work";
import { readWorkDocuments } from "@/models/connected/document-repository";
import {
	readHomeRequests,
	readHomeResources,
} from "@/models/connected/home-repository";
import {
	readEventSettings,
	readMentorCatalog,
} from "@/models/connected/mentor-repository";
import { relationValue } from "@/models/connected/operations";
import { participantRequestSchedule } from "@/models/connected/request";

/** Memuat data akun dan tim untuk struktur Home yang sama dengan desain peserta sebelumnya. */
export async function loadParticipantHome(): Promise<{
	data: ParticipantHomeViewModel | null;
	attention: string;
	error: boolean;
}> {
	const { supabase, user, profile } = await requireSession(["participant"]);
	try {
		const [team, settings, resources, catalog] = await Promise.all([
			readParticipantTeam(supabase, user.id),
			readEventSettings(supabase),
			readHomeResources(supabase),
			readMentorCatalog(supabase, {
				query: "",
				expertise: "",
				date: "",
				page: 1,
			}),
		]);
		const [members, work, documents, joins, mentoring] = await Promise.all([
			team ? readTeamMembers(supabase, team.id) : [],
			team ? readTeamWork(supabase, team.id) : null,
			team ? readWorkDocuments(supabase, team.id) : [],
			team?.leader_id === user.id ? readIncomingJoins(supabase, team.id) : [],
			team
				? readHomeRequests(supabase, team.id)
				: { request: null, attention: "" },
		]);
		const request = mentoring.request;
		const ready = isConnectedWorkReady(work);
		const mentor = request ? relationValue(request.mentor) : null;
		const schedule = request ? participantRequestSchedule(request) : null;
		const date = schedule
			? new Intl.DateTimeFormat("en-CA", {
					timeZone: "Asia/Jakarta",
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
				}).format(new Date(schedule.starts_at))
			: "";
		/** Memformat jam booking aktual tanpa mengubah zona waktu acara. */
		function time(value: string) {
			return new Intl.DateTimeFormat("en-GB", {
				timeZone: "Asia/Jakarta",
				hour: "2-digit",
				minute: "2-digit",
			}).format(new Date(value));
		}
		const data: ParticipantHomeViewModel = {
			actor: { id: user.id, name: profile.full_name ?? "Peserta ADIKARA" },
			settings: {
				dates: settings.dates,
				start: settings.day_start.slice(0, 5),
				end: settings.day_end.slice(0, 5),
				sessionMinutes: settings.session_minutes,
				bufferMinutes: settings.buffer_minutes,
				discord: settings.discord_url,
			},
			users: members.map(
				/** Membawa hanya identitas tampilan anggota ke komponen bersama. */
				function member(item) {
					return { id: item.user_id, name: item.full_name };
				},
			),
			resources,
			preview: catalog.mentors.slice(0, 3).map(
				/** Mengadaptasi profil publik aktual ke bentuk kartu mentor yang sudah ada. */
				function preview(item) {
					return {
						id: item.id,
						name: item.name,
						title: item.title,
						expertise: item.expertise,
						photo: item.photo_url ?? undefined,
						dates: item.available_dates,
					};
				},
			),
			team: team
				? {
						id: team.id,
						name: team.name,
						leaderId: team.leader_id,
						memberIds: members.map(
							/** Menghubungkan urutan anggota ke profil yang sudah dibatasi RLS. */
							function memberId(item) {
								return item.user_id;
							},
						),
					}
				: null,
			work,
			request: request
				? {
						id: request.id,
						code: request.code,
						title: request.title_snapshot,
						status: request.status,
						note: request.decision_note,
						meetingUrl:
							request.status === "approved" ? (request.meeting_url ?? "") : "",
					}
				: null,
			slot: schedule
				? { date, start: time(schedule.starts_at), end: time(schedule.ends_at) }
				: null,
			mentor: mentor
				? {
						name: mentor.name,
						expertise: mentor.expertise,
						photo: mentor.photo_url ?? undefined,
					}
				: null,
			ready,
			files: documents.filter(
				/** Menghitung hanya berkas yang sudah selesai diverifikasi. */
				function file(item) {
					return item.kind === "file" && item.ready;
				},
			).length,
			links: documents.filter(
				/** Menghitung link secara terpisah dari file Storage. */
				function link(item) {
					return item.kind === "drive" && item.ready;
				},
			).length,
			joins: joins.length,
			leader: team?.leader_id === user.id,
			greeting: !team
				? "Mulai dari tim, lalu siapkan karya dan mentoringmu."
				: !ready
					? "Lengkapi gambaran karyamu agar mentor memahami arah timmu."
					: request?.status === "approved"
						? "Sesi timmu sudah siap. Siapkan pertanyaan terbaikmu."
						: request?.status === "revision_requested"
							? "Ada catatan revisi. Tinjau untuk melanjutkan mentoring."
							: request?.status === "pending"
								? "Pengajuan terkirim. Pantau keputusan admin dari sini."
								: "Karyamu siap. Temukan mentor untuk langkah berikutnya.",
		};
		return { data, attention: mentoring.attention, error: false };
	} catch {
		return { data: null, attention: "", error: true };
	}
}
