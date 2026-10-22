// TODO: Tambahkan tipe hasil database generated setelah skema produksi dibakukan.
import { z } from "zod";

export const teamCategories = ["UI/UX", "Softdev", "IoT", "Gamedev"] as const;
export const createTeamInput = z.object({
	name: z.string().trim().min(1).max(80),
	category: z.enum(teamCategories),
	description: z.string().trim().max(500),
});
export const joinTeamInput = z.object({
	team: z.uuid(),
	note: z.string().trim().min(1).max(500),
});
export interface ParticipantTeam {
	id: string;
	name: string;
	category: string;
	description: string;
	leader_id: string;
}
export interface PublicTeam {
	id: string;
	name: string;
	category: string;
	description: string;
	member_count: number;
}
export interface JoinRequest {
	id: string;
	team_id: string;
	user_id: string;
	note: string;
	status: "pending" | "accepted" | "rejected";
	created_at: string;
}
export interface TeamMember {
	user_id: string;
	full_name: string;
	avatar_url: string | null;
}
export interface TeamPageData {
	userId: string;
	team: ParticipantTeam | null;
	members: TeamMember[];
	requests: JoinRequest[];
	publicTeams: PublicTeam[];
	query: string;
	error: boolean;
}
export interface MutationResult {
	error: string | null;
	success?: string;
}

/** Mengubah kesalahan database menjadi pesan aman tanpa membocorkan detail kueri. */
export function teamMutationError(code?: string, message = "") {
	if (code === "23505")
		return "Nama tim atau permintaan sudah ada. Muat ulang untuk melihat status terbaru.";
	if (code === "42501")
		return "Kamu tidak memiliki izin melakukan tindakan ini.";
	const known = [
		"Peserta sudah mempunyai tim.",
		"Kamu sudah mempunyai tim.",
		"Tim penuh.",
		"Tim tidak ditemukan.",
		"Permintaan sudah diproses.",
		"Alihkan ketua ke anggota aktif sebelum keluar.",
		"Tuntaskan atau batalkan pengajuan aktif sebelum mengarsipkan tim terakhir.",
	];
	return known.includes(message)
		? message
		: "Perubahan belum tersimpan. Periksa koneksi lalu coba lagi.";
}
