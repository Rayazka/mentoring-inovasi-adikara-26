// TODO: Pertahankan catatan revisi pada event dan pisahkan penyimpanan karya dari pengiriman ulang.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import { readParticipantRequest } from "@/models/connected/request-repository";
import { requestMutationError } from "@/models/connected/request";
import type { MutationResult } from "@/models/connected/team";

/** Mengirim ulang pengajuan revisi milik ketua tanpa membuat baris pengajuan baru. */
export async function resubmitParticipantRequest(
	_previous: MutationResult & { requestId?: string },
	form: FormData,
): Promise<MutationResult & { requestId?: string }> {
	const { supabase, user } = await requireSession(["participant"]);
	const input = z
		.object({
			request: z.uuid(),
			slot: z.uuid(),
			documents: z.array(z.uuid()).max(100),
		})
		.safeParse({
			request: form.get("request"),
			slot: form.get("slot"),
			documents: form.getAll("documents"),
		});
	if (!input.success)
		return { error: "Pilihan pengajuan, jadwal, atau bahan tidak valid." };
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team || team.leader_id !== user.id)
			return {
				error: "Hanya ketua tim aktif yang dapat mengirim ulang revisi.",
			};
		const request = await readParticipantRequest(
			supabase,
			team.id,
			input.data.request,
		);
		if (!request) return { error: "Pengajuan tidak tersedia untuk timmu." };
		if (request.status === "pending")
			return {
				error: null,
				success: "Pengajuan sudah terkirim dan menunggu keputusan.",
				requestId: request.id,
			};
		if (request.status !== "revision_requested")
			return { error: "Pengajuan ini tidak sedang memerlukan revisi." };
		const { error } = await supabase.rpc("resubmit_request", {
			p_request: request.id,
			p_slot: input.data.slot,
			p_documents: input.data.documents,
		});
		if (error)
			return { error: requestMutationError(error.code, error.message) };
	} catch {
		return { error: requestMutationError() };
	}
	revalidatePath("/peserta", "layout");
	revalidatePath("/admin", "layout");
	revalidatePath("/mentor", "layout");
	return {
		error: null,
		success: "Revisi dikirim ulang dan menunggu keputusan admin.",
		requestId: input.data.request,
	};
}
