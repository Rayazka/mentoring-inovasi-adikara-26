// TODO: Pertahankan validasi server dan mutasi RPC atomik untuk setiap tindakan peserta.
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import {
	createTeamInput,
	joinTeamInput,
	teamMutationError,
	type MutationResult,
} from "@/models/connected/team";
import { readParticipantTeam } from "@/models/connected/team-repository";

/** Membuat tim beserta keanggotaan ketua dalam satu transaksi database. */
export async function createParticipantTeam(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase } = await requireSession(["participant"]);
	const parsed = createTeamInput.safeParse(Object.fromEntries(form));
	if (!parsed.success)
		return {
			error:
				"Isi nama tim, kategori yang tersedia, dan deskripsi maksimal 500 karakter.",
		};
	try {
		const { error } = await supabase.rpc("create_team", {
			p_name: parsed.data.name,
			p_category: parsed.data.category,
			p_description: parsed.data.description,
		});
		if (error) return { error: teamMutationError(error.code, error.message) };
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success: "Tim berhasil dibuat. Kamu menjadi ketua tim.",
	};
}

/** Mengajukan permintaan tanpa memberikan akses privat atau langsung menjadi anggota tim. */
export async function requestParticipantJoin(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase } = await requireSession(["participant"]);
	const parsed = joinTeamInput.safeParse(Object.fromEntries(form));
	if (!parsed.success)
		return {
			error:
				"Pilih tim yang valid dan isi perkenalan sepanjang 1–500 karakter.",
		};
	try {
		const { error } = await supabase.rpc("request_team_join", {
			p_team: parsed.data.team,
			p_note: parsed.data.note,
		});
		if (error) return { error: teamMutationError(error.code, error.message) };
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success: "Permintaan terkirim. Tunggu persetujuan ketua tim.",
	};
}

/** Memeriksa ketua dan tim pemohon sebelum menyerahkan keputusan ke transaksi database. */
export async function reviewParticipantJoin(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase, user } = await requireSession(["participant"]);
	const input = z
		.object({ join: z.uuid(), decision: z.enum(["accept", "reject"]) })
		.safeParse(Object.fromEntries(form));
	if (!input.success)
		return { error: "Pilih permintaan dan keputusan yang valid." };
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team || team.leader_id !== user.id)
			return { error: "Hanya ketua tim yang dapat memutuskan permintaan." };
		const { data: join, error: readError } = await supabase
			.from("team_join_requests")
			.select("team_id")
			.eq("id", input.data.join)
			.maybeSingle();
		if (readError || !join || join.team_id !== team.id)
			return { error: "Permintaan tidak tersedia untuk timmu." };
		const { error } = await supabase.rpc("review_team_join", {
			p_join: input.data.join,
			p_accept: input.data.decision === "accept",
		});
		if (error) return { error: teamMutationError(error.code, error.message) };
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success:
			input.data.decision === "accept"
				? "Anggota diterima."
				: "Permintaan ditolak.",
	};
}
