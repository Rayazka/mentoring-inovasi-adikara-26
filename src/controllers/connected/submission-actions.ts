// TODO: Pertahankan kunci idempotensi yang sama selama retry agar tidak membuat pengajuan ganda.
"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { requestInput, requestMutationError } from "@/models/connected/request";
import type { MutationResult } from "@/models/connected/team";

/** Mengirim pengajuan melalui RPC yang memvalidasi karya, dokumen, slot dan idempotensi secara atomik. */
export async function submitParticipantRequest(
	_previous: MutationResult & { requestId?: string },
	form: FormData,
): Promise<MutationResult & { requestId?: string }> {
	const { supabase, user } = await requireSession(["participant"]);
	const parsed = requestInput.safeParse({
		slot: form.get("slot"),
		key: form.get("key"),
		documents: form.getAll("documents"),
	});
	if (!parsed.success)
		return {
			error:
				"Pilihan jadwal atau bahan tidak valid. Buka ulang halaman review.",
		};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team || team.leader_id !== user.id)
			return { error: "Hanya ketua tim aktif yang dapat mengirim pengajuan." };
		const { data, error } = await supabase.rpc("submit_request", {
			p_team: team.id,
			p_slot: parsed.data.slot,
			p_key: parsed.data.key,
			p_documents: parsed.data.documents,
		});
		if (error || !data)
			return { error: requestMutationError(error?.code, error?.message) };
		revalidatePath("/peserta", "layout");
		return {
			error: null,
			success:
				"Pengajuan terkirim dan menunggu keputusan admin. Slot belum terkonfirmasi.",
			requestId: String(data),
		};
	} catch {
		return { error: requestMutationError() };
	}
}
