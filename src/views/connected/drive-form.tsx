// TODO: Pertahankan penjelasan izin Google Drive pada form tambah dan perbaikan tautan.
import { saveParticipantDrive } from "@/controllers/connected/document-actions";
import type { TeamDocument } from "@/models/connected/document";
import { MutationForm } from "./mutation-form";

/** Menyajikan form link baru atau perubahan link dengan URL tersimpan sebagai nilai awal. */
export function DriveForm({ document }: { document?: TeamDocument }) {
	return (
		<div className="stack">
			<p className="helper">
				Menyimpan link tidak memberi izin Google secara otomatis. Atur akses
				Viewer bagi akun mentor yang akan membuka bahan, atau gunakan berbagi
				tautan sesuai kebijakan tim, lalu uji aksesnya.
			</p>
			<MutationForm
				action={saveParticipantDrive}
				submit={document ? "Simpan perubahan link" : "Simpan link Drive"}
				fields={[
					{
						name: "document",
						label: "Dokumen",
						type: "hidden",
						value: document?.id ?? "",
					},
					{
						name: "title",
						label: "Judul bahan",
						required: true,
						maxLength: 150,
						value: document?.title ?? "",
					},
					{
						name: "url",
						label: "Link file atau folder Google Drive",
						type: "url",
						required: true,
						value: document?.drive_url ?? "",
					},
				]}
			/>
		</div>
	);
}
