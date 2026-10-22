// TODO: Pertahankan keselarasan hak tindakan UI dengan pemeriksaan controller dan RLS.
import type { TeamDocument } from "@/models/connected/document";
import { deleteParticipantDocument } from "@/controllers/connected/document-actions";
import { Badge, EmptyState, Panel } from "@/views/components/ui";
import { DocumentUpload } from "./document-upload";
import { MutationForm } from "./mutation-form";

/** Menampilkan bahan tim serta unggah dan hapus berizin pada halaman Identitas Karya. */
export function WorkDocuments({
	documents,
	userId,
	leaderId,
}: {
	documents: TeamDocument[];
	userId: string;
	leaderId: string;
}) {
	return (
		<div className="work-documents" id="dokumen-pendukung">
			<Panel title="Dokumen Pendukung">
				<div className="stack">
					<p>{documents.length} bahan diskusi milik tim.</p>
					<details className="upload-disclosure">
						<summary className="button secondary">Tambah file</summary>
						<DocumentUpload />
					</details>
					{documents.length ? (
						documents.map(
							/** Menampilkan status file aktual dan hanya tindakan yang sesuai hak anggota. */
							function document(item) {
								return (
									<article className="subtle-box stack compact" key={item.id}>
										<div className="row spread wrap">
											<strong>{item.title}</strong>
											<Badge
												label={
													item.ready
														? "Siap digunakan"
														: "Unggahan belum selesai"
												}
											/>
										</div>
										<p>
											{item.filename ?? "Google Drive"}
											{item.bytes
												? ` · ${(item.bytes / 1048576).toFixed(2)} MB`
												: ""}
										</p>
										{item.inaccessible && (
											<p className="notice warning">
												Bahan ditandai belum dapat diakses. Periksa file atau
												izin folder.
											</p>
										)}
										{item.ready &&
											(item.kind === "file" ? (
												<a
													className="text-link"
													href={`/api/documents/${item.id}/download`}
												>
													Unduh file
												</a>
											) : (
												item.drive_url && (
													<a
														className="text-link"
														href={item.drive_url}
														target="_blank"
														rel="noreferrer"
													>
														Buka Google Drive
													</a>
												)
											))}
										{(item.uploaded_by === userId || userId === leaderId) && (
											<details>
												<summary>Hapus bahan</summary>
												<p>
													Akses bahan akan dicabut. Riwayat pengajuan tetap
													dipertahankan.
												</p>
												<MutationForm
													action={deleteParticipantDocument}
													submit="Konfirmasi hapus"
													fields={[
														{
															name: "document",
															label: "Dokumen",
															type: "hidden",
															value: item.id,
														},
														{
															name: "confirmation",
															label: "Ketik HAPUS",
															required: true,
															maxLength: 5,
														},
													]}
												/>
											</details>
										)}
									</article>
								);
							},
						)
					) : (
						<EmptyState
							title="Belum ada bahan diskusi"
							description="Tambahkan proposal atau bahan pendukung yang membantu mentor memahami karya."
							icon="file"
						/>
					)}
				</div>
			</Panel>
		</div>
	);
}
