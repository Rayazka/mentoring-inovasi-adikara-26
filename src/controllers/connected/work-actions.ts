// TODO: Pertahankan snapshot pengajuan saat karya tim diperbarui melalui RPC.
"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { workInput } from "@/models/connected/work";
import {
	teamMutationError,
	type MutationResult,
} from "@/models/connected/team";

/** Menyimpan draf atau karya lengkap hanya untuk tim aktif pengguna yang terverifikasi. */
export async function saveParticipantWork(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase, user } = await requireSession(["participant"]);
	const input = workInput.safeParse(Object.fromEntries(form));
	if (!input.success)
		return {
			error:
				"Judul maksimal 150 karakter dan deskripsi maksimal 5.000 karakter. Keduanya wajib diisi untuk karya siap.",
		};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { error: "Bergabung atau buat tim terlebih dahulu." };
		const { error } = await supabase.rpc("save_work", {
			p_team: team.id,
			p_title: input.data.title,
			p_description: input.data.description,
			p_draft: input.data.intent === "draft",
		});
		if (error) return { error: teamMutationError(error.code, error.message) };
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success:
			input.data.intent === "draft"
				? "Draf tersimpan. Lengkapi judul dan deskripsi sebelum mengajukan mentoring."
				: "Identitas karya tersimpan dan siap digunakan untuk pengajuan.",
	};
}
