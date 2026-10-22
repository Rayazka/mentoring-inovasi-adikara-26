// TODO: Pertahankan validasi server dan mutasi RPC atomik untuk setiap tindakan peserta.
"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import {
	createTeamInput,
	joinTeamInput,
	teamMutationError,
	type MutationResult,
} from "@/models/connected/team";

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
