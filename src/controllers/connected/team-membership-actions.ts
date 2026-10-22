// TODO: Pertahankan pencabutan akses mantan anggota melalui RLS selain penyembunyian tombol.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import {
	teamMutationError,
	type MutationResult,
} from "@/models/connected/team";

/** Memindahkan kepemimpinan atau keluar dari tim sendiri dengan konfirmasi dan transaksi database. */
export async function changeParticipantMembership(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase, user } = await requireSession(["participant"]);
	const input = z
		.object({
			operation: z.enum(["leave", "transfer"]),
			confirmation: z.literal("KONFIRMASI"),
			successor: z.union([z.uuid(), z.literal("")]).default(""),
		})
		.safeParse(Object.fromEntries(form));
	if (!input.success)
		return {
			error: "Ketik KONFIRMASI dan pilih anggota pengganti bila diperlukan.",
		};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { error: "Kamu belum memiliki tim aktif." };
		if (
			input.data.operation === "transfer" &&
			(team.leader_id !== user.id ||
				!input.data.successor ||
				input.data.successor === user.id)
		)
			return {
				error:
					"Hanya ketua yang dapat memilih anggota lain sebagai ketua pengganti.",
			};
		const { error } =
			input.data.operation === "transfer"
				? await supabase.rpc("transfer_team_leader", {
						p_team: team.id,
						p_user: input.data.successor,
					})
				: await supabase.rpc("leave_team", {
						p_team: team.id,
						p_successor: input.data.successor || null,
					});
		if (error) return { error: teamMutationError(error.code, error.message) };
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success:
			input.data.operation === "leave"
				? "Kamu sudah keluar dari tim."
				: "Ketua tim berhasil dialihkan.",
	};
}
