// TODO: Pertahankan label keputusan yang jelas serta konfirmasi sebelum admin membuat booking.
import { reviewAdminRequest } from "@/controllers/connected/admin-review-actions";
import { Panel } from "@/views/components/ui";
import { MutationForm } from "./mutation-form";

/** Menyajikan keputusan operasional khusus admin dengan persyaratan per status. */
export function AdminReview({ requestId }: { requestId: string }) {
	return (
		<Panel title="Keputusan pengajuan">
			<div className="stack">
				<p>
					ACC wajib menyertakan tautan pertemuan HTTPS. Tolak dan revisi wajib
					disertai catatan. Slot dikunci hanya jika ACC berhasil.
				</p>
				<MutationForm
					action={reviewAdminRequest}
					submit="Simpan keputusan"
					fields={[
						{
							name: "request",
							label: "Pengajuan",
							type: "hidden",
							value: requestId,
						},
						{
							name: "decision",
							label: "Keputusan",
							type: "select",
							options: ["approved", "revision_requested", "rejected"],
							optionLabels: {
								approved: "ACC / Disetujui",
								revision_requested: "Minta revisi",
								rejected: "Tolak pengajuan",
							},
						},
						{
							name: "meeting",
							label: "Tautan pertemuan HTTPS — wajib untuk ACC",
							type: "url",
							maxLength: 2000,
						},
						{
							name: "note",
							label: "Catatan / alasan — wajib untuk revisi dan penolakan",
							type: "textarea",
							maxLength: 2000,
						},
						{
							name: "revision",
							label: "Bagian yang perlu direvisi — untuk keputusan revisi",
							type: "select",
							options: ["work", "schedule", "both"],
							optionLabels: {
								work: "Identitas karya dan bahan",
								schedule: "Jadwal",
								both: "Karya dan jadwal",
							},
						},
						{
							name: "confirmation",
							label: "Ketik KONFIRMASI",
							required: true,
							maxLength: 10,
						},
					]}
				/>
			</div>
		</Panel>
	);
}
