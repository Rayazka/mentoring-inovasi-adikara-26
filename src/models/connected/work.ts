// TODO: Pertahankan perbedaan draf parsial dan karya siap pada seluruh pemakai identitas karya.
import { z } from "zod";
export const workInput = z
	.object({
		title: z.string().trim().max(150),
		description: z.string().trim().max(5000),
		intent: z.enum(["draft", "ready"]),
	})
	.refine(
		/** Mengharuskan judul dan deskripsi hanya ketika karya dinyatakan siap. */
		function completeWork(value) {
			return (
				value.intent === "draft" || Boolean(value.title && value.description)
			);
		},
	);
export interface WorkRecord {
	team_id: string;
	title: string;
	description: string;
	is_draft: boolean;
	updated_at: string;
	updated_by: string;
}
/** Menentukan kesiapan dari data tersimpan, bukan dari keberadaan file pendukung. */
export function isConnectedWorkReady(work: WorkRecord | null) {
	return Boolean(
		work && !work.is_draft && work.title.trim() && work.description.trim(),
	);
}
