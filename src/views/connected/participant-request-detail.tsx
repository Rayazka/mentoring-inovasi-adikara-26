// TODO: Pertahankan snapshot karya dan judul bahan ketika dokumen aktif diubah atau dihapus.
import Link from "next/link";
import type { loadParticipantRequest } from "@/controllers/connected/participant-requests";
import { relationValue, formatWib } from "@/models/connected/operations";
import { Panel, EmptyState } from "@/views/components/ui";
import { ParticipantRequestCard } from "./participant-requests";

/** Menampilkan bahan saat pengajuan dan jejak keputusan yang benar-benar tercatat. */
export function ConnectedRequestDetail({
	data,
}: {
	data: Awaited<ReturnType<typeof loadParticipantRequest>>;
}) {
	if (data.kind !== "ready")
		return (
			<Panel>
				<EmptyState
					title={
						data.kind === "error"
							? "Pengajuan belum dapat dimuat"
							: "Pengajuan tidak tersedia"
					}
					description="Periksa koneksi dan pastikan pengajuan merupakan milik tim aktifmu."
					icon="request"
				>
					<Link href="/peserta/pengajuan" className="button">
						Kembali ke pengajuan
					</Link>
				</EmptyState>
			</Panel>
		);
	return (
		<>
			<Link className="text-link" href="/peserta/pengajuan">
				← Kembali ke pengajuan
			</Link>
			<ParticipantRequestCard request={data.request} />
			<div className="team-columns">
				<Panel title="Identitas karya saat pengajuan">
					<h3>{data.request.title_snapshot}</h3>
					<p style={{ whiteSpace: "pre-wrap" }}>
						{data.request.description_snapshot}
					</p>
					<Link href="/peserta/karya" className="text-link">
						Lihat identitas karya terbaru
					</Link>
				</Panel>
				<Panel title="Bahan saat pengajuan">
					<div className="stack">
						{data.documents.length ? (
							data.documents.map(
								/** Menjaga judul snapshot sambil menghormati pencabutan akses dokumen yang telah dihapus. */
								function snapshot(item) {
									const document = relationValue(item.document);
									return (
										<article
											className="subtle-box stack compact"
											key={item.document_id}
										>
											<strong>{item.title_snapshot}</strong>
											{!document ? (
												<p>
													Bahan telah dihapus atau aksesnya tidak lagi tersedia.
												</p>
											) : !document.ready ? (
												<p>Bahan belum siap digunakan.</p>
											) : document.kind === "file" ? (
												<a
													href={`/api/documents/${document.id}/download`}
													className="text-link"
												>
													Unduh file
												</a>
											) : (
												document.drive_url && (
													<a
														href={document.drive_url}
														className="text-link"
														target="_blank"
														rel="noreferrer"
													>
														Buka Google Drive
													</a>
												)
											)}
										</article>
									);
								},
							)
						) : (
							<p>Tidak ada bahan pendukung yang dipilih pada pengajuan ini.</p>
						)}
					</div>
				</Panel>
			</div>
			<Panel title="Riwayat aktivitas">
				<div className="stack">
					{data.events.length ? (
						data.events.map(
							/** Menampilkan kejadian tersimpan tanpa mengarang tahap proses yang belum terjadi. */
							function event(item) {
								return (
									<article className="subtle-box stack compact" key={item.id}>
										<strong>{item.action}</strong>
										<small>{formatWib(item.created_at)}</small>
										{item.note && (
											<p style={{ whiteSpace: "pre-wrap" }}>{item.note}</p>
										)}
									</article>
								);
							},
						)
					) : (
						<p>Belum ada riwayat aktivitas.</p>
					)}
				</div>
			</Panel>
		</>
	);
}
