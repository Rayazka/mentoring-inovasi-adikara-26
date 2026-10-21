// TODO: Pertahankan konteks revisi dan peringatan akses sampai anggota memperbaiki link tim.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { TeamDocument } from "@/models/demo/types";
import { Button, EmptyState, Icon, Modal, Panel } from "@/views/components/ui";

/** Menyediakan tambah, edit, hapus dan pelaporan link Drive tanpa mengklaim izin otomatis. */
export function DrivePanel({
	controller,
	teamId,
	readonly = false,
}: {
	controller: DemoController;
	teamId: string;
	readonly?: boolean;
}) {
	const { state, actor, dispatch } = controller;
	const [editing, setEditing] = useState<TeamDocument | "new" | null>(null);
	const [removeId, setRemoveId] = useState("");
	/** Menampilkan formulir link baru. */
	function addLink() {
		setEditing("new");
	}
	/** Menutup formulir link tanpa menghilangkan data tersimpan. */
	function closeEdit() {
		setEditing(null);
	}
	/** Menutup dialog hapus. */
	function closeRemove() {
		setRemoveId("");
	}
	/** Menyimpan tautan tervalidasi dan menutup form hanya ketika berhasil. */
	function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			dispatch("drive.save", {
				id: editing && editing !== "new" ? editing.id : "",
				title: form.get("title"),
				url: form.get("url"),
			})
		)
			closeEdit();
	}
	/** Menghapus link setelah pengguna mengonfirmasi dampaknya pada daftar karya. */
	function remove() {
		if (dispatch("document.delete", { id: removeId })) closeRemove();
	}
	if (!state || !actor) return null;
	const links = state.documents.filter(
		/** Membatasi daftar pada link tim yang sudah diperiksa aksesnya oleh halaman induk. */
		function teamLink(item) {
			return item.teamId === teamId && item.kind === "drive";
		},
	);
	return (
		<>
			<Panel
				title="Link Google Drive"
				icon="external"
				actions={
					!readonly && (
						<Button variant="secondary" className="small" onClick={addLink}>
							Tambah link
						</Button>
					)
				}
			>
				<div className="stack">
					<p className="helper">
						Menyimpan link di sini tidak memberi izin Google secara otomatis.
						Atur akses Viewer bagi mentor pada Drive dan uji link melalui
						jendela privat sebelum mengajukan mentoring.
					</p>
					{links.length ? (
						links.map(
							/** Menampilkan URL nyata dan status akses yang dilaporkan mentor. */
							function linkRow(item) {
								/** Membuka form perubahan menggunakan data link yang dipilih. */
								function editLink() {
									setEditing(item);
								}
								/** Meminta konfirmasi penghapusan satu link. */
								function deleteLink() {
									setRemoveId(item.id);
								}
								/** Memberi tahu ketua bahwa link karya tidak dapat diakses mentor. */
								function reportAccess() {
									dispatch("drive.report", { id: item.id });
								}
								return (
									<article className="subtle-box stack compact" key={item.id}>
										<strong>{item.title}</strong>
										<a
											className="text-link"
											href={item.url}
											target="_blank"
											rel="noreferrer"
										>
											Buka Google Drive <Icon name="external" />
										</a>
										{item.inaccessible && (
											<p className="notice warning">
												Mentor melaporkan bahan ini tidak dapat diakses. Periksa
												izin berbagi, lalu perbarui link.
											</p>
										)}
										<div className="actions">
											{!readonly ? (
												<>
													<Button
														variant="neutral"
														className="small"
														onClick={editLink}
													>
														Edit / perbaiki
													</Button>
													<Button
														variant="danger"
														className="small"
														onClick={deleteLink}
													>
														Hapus
													</Button>
												</>
											) : (
												actor.role === "mentor" && (
													<Button
														variant="neutral"
														className="small"
														onClick={reportAccess}
														disabled={item.inaccessible}
													>
														Laporkan akses bermasalah
													</Button>
												)
											)}
										</div>
									</article>
								);
							},
						)
					) : (
						<EmptyState
							title="Belum ada link Drive"
							description="Tambahkan folder atau dokumen pendukung untuk dibaca mentor."
						/>
					)}
				</div>
			</Panel>
			<Modal
				open={Boolean(editing)}
				title={editing === "new" ? "Tambah link Drive" : "Edit link Drive"}
				onClose={closeEdit}
			>
				{editing && (
					<form
						key={editing === "new" ? "new" : editing.id}
						onSubmit={save}
						className="stack"
					>
						<label className="field">
							Judul link
							<input
								name="title"
								required
								maxLength={150}
								defaultValue={editing === "new" ? "" : editing.title}
							/>
						</label>
						<label className="field">
							URL Google Drive
							<input
								name="url"
								type="url"
								required
								defaultValue={editing === "new" ? "" : editing.url}
								placeholder="https://drive.google.com/…"
							/>
						</label>
						<p className="helper">
							Periksa izin Viewer sebelum menyimpan. Akses belum diverifikasi
							otomatis.
						</p>
						<div className="actions">
							<Button variant="neutral" onClick={closeEdit}>
								Batal
							</Button>
							<Button type="submit">Simpan link</Button>
						</div>
					</form>
				)}
			</Modal>
			<Modal
				open={Boolean(removeId)}
				title="Hapus link karya?"
				onClose={closeRemove}
			>
				<p>
					Link dihapus dari daftar tim. Berkas asli di Google Drive tetap ada.
				</p>
				<div className="actions">
					<Button variant="neutral" onClick={closeRemove}>
						Batal
					</Button>
					<Button variant="danger" onClick={remove}>
						Hapus link
					</Button>
				</div>
			</Modal>
		</>
	);
}
