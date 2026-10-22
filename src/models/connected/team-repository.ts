// TODO: Ganti cast hasil kueri dengan tipe generated Supabase tanpa memperluas proyeksi publik.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
	JoinRequest,
	ParticipantTeam,
	PublicTeam,
	TeamMember,
} from "./team";

/** Menghentikan pembacaan ketika kueri gagal agar kondisi error tidak disamarkan sebagai data kosong. */
function checked<T>(result: { data: unknown; error: unknown }): T {
	if (result.error) throw new Error("Pembacaan tim gagal.");
	return result.data as T;
}

/** Membaca keanggotaan akun sendiri melalui RLS sebelum membuka data privat tim. */
export async function readParticipantTeam(
	client: SupabaseClient,
	userId: string,
) {
	const membership = checked<{ team_id: string } | null>(
		await client
			.from("team_members")
			.select("team_id")
			.eq("user_id", userId)
			.maybeSingle(),
	);
	if (!membership) return null;
	return checked<ParticipantTeam | null>(
		await client
			.from("teams")
			.select("id,name,category,description,leader_id")
			.eq("id", membership.team_id)
			.eq("archived", false)
			.maybeSingle(),
	);
}

/** Mengambil anggota dan nama profil hanya pada tim yang dapat diakses oleh sesi saat ini. */
export async function readTeamMembers(
	client: SupabaseClient,
	teamId: string,
): Promise<TeamMember[]> {
	const memberships = checked<{ user_id: string }[]>(
		await client
			.from("team_members")
			.select("user_id")
			.eq("team_id", teamId)
			.order("joined_at"),
	);
	if (!memberships.length) return [];
	const profiles = checked<
		{ id: string; full_name: string; avatar_url: string | null }[]
	>(
		await client
			.from("profiles")
			.select("id,full_name,avatar_url")
			.in(
				"id",
				memberships.map(
					/** Membatasi pembacaan profil ke anggota yang telah lolos aturan database. */
					function memberId(member) {
						return member.user_id;
					},
				),
			),
	);
	return memberships.map(
		/** Menyatukan identitas anggota tanpa membawa email atau atribut administratif. */
		function memberProfile(member) {
			const profile = profiles.find(
				/** Mencocokkan profil dengan identitas anggota. */
				function matchingProfile(item) {
					return item.id === member.user_id;
				},
			);
			return {
				...member,
				full_name: profile?.full_name ?? "Peserta ADIKARA",
				avatar_url: profile?.avatar_url ?? null,
			};
		},
	);
}

/** Membaca permintaan milik peserta tanpa membuka karya atau dokumen tim tujuan. */
export async function readOwnJoinRequests(
	client: SupabaseClient,
	userId: string,
) {
	return checked<JoinRequest[]>(
		await client
			.from("team_join_requests")
			.select("id,team_id,user_id,note,status,created_at")
			.eq("user_id", userId)
			.order("created_at", { ascending: false })
			.limit(100),
	);
}

/** Memakai proyeksi publik RPC agar pencarian tidak membaca tabel privat tim lain. */
export async function searchPublicTeams(client: SupabaseClient, query: string) {
	return checked<PublicTeam[]>(
		await client.rpc("search_teams", { p_query: query }),
	);
}
