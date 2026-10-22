// TODO: Pertahankan validasi keputusan sejalan dengan aturan transisi RPC review_request.
import { z } from "zod";
export const reviewInput = z
	.object({
		request: z.uuid(),
		decision: z.enum(["approved", "rejected", "revision_requested"]),
		note: z.string().trim().max(2000),
		meeting: z.string().trim().max(2000),
		revision: z.enum(["work", "schedule", "both"]),
		confirmation: z.literal("KONFIRMASI"),
	})
	.superRefine(
		/** Mengharuskan URL pertemuan untuk ACC dan alasan yang jelas untuk revisi atau penolakan. */
		function decisionRequirements(input, context) {
			if (input.decision !== "approved" && !input.note)
				context.addIssue({
					code: "custom",
					message: "Catatan wajib diisi.",
					path: ["note"],
				});
			if (input.decision === "approved") {
				try {
					const url = new URL(input.meeting);
					if (
						url.protocol !== "https:" ||
						url.username ||
						url.password ||
						/\s/.test(input.meeting)
					)
						throw new Error("URL tidak valid.");
				} catch {
					context.addIssue({
						code: "custom",
						message: "Tautan pertemuan HTTPS wajib diisi.",
						path: ["meeting"],
					});
				}
			}
		},
	);
