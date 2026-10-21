// TODO: Tampilkan progres jaringan sesungguhnya setelah upload dipindahkan dari perangkat ke Storage.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import {
	deleteDemoFile,
	downloadDemoFile,
	uploadDemoFile,
} from "@/controllers/demo/file-controller";
import {
	Button,
	EmptyState,
	Modal,
	Panel,
	formatDate,
} from "@/views/components/ui";

/** Menampilkan berkas tim dengan unggah lokal, status gagal, coba ulang, unduh dan konfirmasi penghapusan. */
export function DocumentsPanel({
	controller,
	teamId,
	readonly = false,
	compact = false,
}: {
	controller: DemoController;
	teamId: string;
	readonly?: boolean;
	compact?: boolean;
}) {
	const { state } = controller;
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState(false);
	const [removeId, setRemoveId] = useState("");
	/** Menyimpan file terpilih tanpa menghapus input saat terjadi kegagalan. */
	async function upload(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const values = new FormData(form);
		const file = values.get("file");
		if (!(file instanceof File)) return;
		setBusy(true);
		setError(false);
		setMessage("Menyimpan file pada perangkat…");
		try {
			setMessage(await uploadDemoFile(file, String(values.get("title") ?? "")));
			form.reset();
		} catch (cause) {
			setError(true);
			setMessage(
				cause instanceof Error
					? cause.message
					: "Upload gagal. Silakan coba lagi.",
			);
		} finally {
			setBusy(false);
		}
	}
	/** Membatalkan dialog penghapusan dokumen. */
	function closeRemove() {
		setRemoveId("");
	}
	/** Menghapus dokumen setelah pengguna meninjau konfirmasi. */
	async function remove() {
		setBusy(true);
		setError(false);
		try {
			setMessage(await deleteDemoFile(removeId));
			closeRemove();
		} catch (cause) {
			setError(true);
			setMessage(cause instanceof Error ? cause.message : "Penghapusan gagal.");
		} finally {
			setBusy(false);
		}
	}
	if (!state) return null;
	const documents = state.documents.filter(
		/** Mengambil file milik tim yang sudah diperiksa oleh halaman induk. */
		function teamDocument(item) {
			return item.teamId === teamId && item.kind === "file";
		},
	);
	return (
		<>
			<Panel title="Dokumen Karya" icon="file">
				<div className="stack">
					{!readonly && (
						<details
							className="upload-disclosure"
							open={compact ? undefined : true}
						>
							<summary className="button secondary">Upload File</summary>
							<form onSubmit={upload} className="stack">
								<p className="helper">
									Mode demo: file tersimpan hanya pada browser ini. PDF, DOCX,
									PPTX, PNG, JPG · maksimal 10 MB/file, 10 file dan 50 MB/tim.
								</p>
								<div className="form-grid">
									<label className="field">
										Judul dokumen
										<input
											name="title"
											maxLength={150}
											placeholder="Contoh: Proposal versi 1"
										/>
									</label>
									<label className="field">
										Pilih file
										<input
											name="file"
											type="file"
											accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
											required
										/>
									</label>
								</div>
								<Button type="submit" disabled={busy}>
									{busy ? "Memproses…" : "Unggah dokumen"}
								</Button>
							</form>
						</details>
					)}
					{message && (
						<p
							role={error ? "alert" : "status"}
							className={`notice ${error ? "danger" : "success"}`}
						>
							{message}
						</p>
					)}
					{documents.length ? (
						documents.map(
							/** Menampilkan metadata dan mengunduh melalui controller yang memeriksa ulang izin. */
							function documentRow(item) {
								/** Mengunduh file dan menampilkan pesan ketika objek perangkat tidak tersedia. */
								async function download() {
									try {
										await downloadDemoFile(item.id);
									} catch (cause) {
										setError(true);
										setMessage(
											cause instanceof Error ? cause.message : "Unduhan gagal.",
										);
									}
								}
								/** Meminta persetujuan sebelum menghapus berkas yang dipilih. */
								function requestRemove() {
									setRemoveId(item.id);
								}
								return (
									<div className="document-row" key={item.id}>
										<div>
											<strong>{item.title}</strong>
											<small>
												{item.filename} ·{" "}
												{((item.bytes ?? 0) / 1024 / 1024).toFixed(2)} MB ·{" "}
												{formatDate(item.updatedAt)}
											</small>
										</div>
										<div className="actions">
											<Button
												variant="secondary"
												className="small"
												onClick={download}
											>
												Unduh
											</Button>
											{!readonly && (
												<Button
													variant="danger"
													className="small"
													onClick={requestRemove}
													disabled={busy}
												>
													Hapus
												</Button>
											)}
										</div>
									</div>
								);
							},
						)
					) : (
						<EmptyState
							title="Belum ada berkas"
							description="Tambahkan bahan agar mentor memahami perkembangan karya tim."
						/>
					)}
				</div>
			</Panel>
			<Modal
				open={Boolean(removeId)}
				title="Hapus dokumen?"
				onClose={closeRemove}
			>
				<p>
					Dokumen akan dihapus dari daftar tim. Pengajuan lama tetap mencatat
					referensinya sebagai dokumen terhapus.
				</p>
				<div className="actions">
					<Button variant="neutral" onClick={closeRemove}>
						Batal
					</Button>
					<Button variant="danger" onClick={remove} disabled={busy}>
						Hapus dokumen
					</Button>
				</div>
			</Modal>
		</>
	);
}
