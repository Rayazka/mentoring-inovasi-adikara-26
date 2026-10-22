// TODO: Pertahankan keputusan hanya untuk admin selama mentor general memakai akun bersama baca saja.
"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { reviewInput } from "@/models/connected/review";
import type { MutationResult } from "@/models/connected/team";

/** Menerapkan keputusan admin dan reservasi slot melalui satu transaksi RPC terotorisasi. */
export async function reviewAdminRequest(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase } = await requireSession(["admin"]);
	const input = reviewInput.safeParse(Object.fromEntries(form));
	if (!input.success)
		return {
			error:
				"ACC memerlukan tautan HTTPS; revisi/tolak memerlukan catatan. Ketik KONFIRMASI untuk menyimpan keputusan.",
		};
	try {
		const { error } = await supabase.rpc("review_request", {
			p_request: input.data.request,
			p_decision: input.data.decision,
			p_note: input.data.note,
			p_meeting_url:
				input.data.decision === "approved" ? input.data.meeting : null,
			p_revision_kind:
				input.data.decision === "revision_requested"
					? input.data.revision
					: null,
		});
		if (error)
			return {
				error:
					error.message ===
					"Jadwal baru saja terbooking atau bentrok dengan sesi tim. Minta revisi jadwal."
						? error.message
						: "Keputusan belum tersimpan. Status atau slot mungkin sudah berubah; muat ulang dan periksa kembali.",
			};
	} catch {
		return {
			error: "Keputusan belum tersimpan. Periksa koneksi dan coba lagi.",
		};
	}
	revalidatePath("/peserta", "layout");
	revalidatePath("/admin", "layout");
	revalidatePath("/mentor", "layout");
	return {
		error: null,
		success: "Keputusan tersimpan dan tercatat pada riwayat pengajuan.",
	};
}
