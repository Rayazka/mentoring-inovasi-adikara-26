// TODO: Pertahankan input belum tersimpan dan deep link pengisian sesuai referensi P8uOso.
"use client";
import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { saveParticipantWork } from "@/controllers/connected/work-actions";
import type { WorkRecord } from "@/models/connected/work";
import { Badge, Panel } from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";

/** Memakai struktur form identitas karya yang disepakati dengan penyimpanan server, bukan data demo. */
export function ConnectedWorkForm({ work }: { work: WorkRecord | null }) {
	const [title, setTitle] = useState(work?.title ?? "");
	const [description, setDescription] = useState(work?.description ?? "");
	const [dirty, setDirty] = useState(false);
	const [state, action, pending] = useActionState(saveParticipantWork, {
		error: null,
	});
	/** Menghapus penanda perubahan hanya setelah server mengonfirmasi penyimpanan. */
	useEffect(
		function saved() {
			if (state.success) setDirty(false);
		},
		[state],
	);
	/** Memperbarui judul tanpa menghapus isian ketika server menolak penyimpanan. */
	function changeTitle(event: ChangeEvent<HTMLInputElement>) {
		setTitle(event.target.value);
		setDirty(true);
	}
	/** Memperbarui deskripsi dan menandai pekerjaan yang belum disimpan. */
	function changeDescription(event: ChangeEvent<HTMLTextAreaElement>) {
		setDescription(event.target.value);
		setDirty(true);
	}
	return (
		<div id="informasi-karya" className="work-information">
			<Panel
				title="Informasi Karya"
				actions={
					<Badge
						label={
							dirty ? "Belum disimpan" : work ? "Tersimpan" : "Belum diisi"
						}
						tone={dirty ? "warning" : "success"}
					/>
				}
			>
				<form className="stack" action={action}>
					<p className="helper">
						Judul dan deskripsi wajib diisi agar mentor memahami arah karyamu.
					</p>
					<label className="field" htmlFor="judul-topik">
						Judul topik *
						<input
							id="judul-topik"
							name="title"
							value={title}
							onChange={changeTitle}
							maxLength={150}
							required
							placeholder="Apa judul atau topik karya timmu?"
						/>
						<small>{title.length}/150 karakter</small>
					</label>
					<label className="field" htmlFor="deskripsi-topik">
						Deskripsi topik *
						<textarea
							id="deskripsi-topik"
							name="description"
							value={description}
							onChange={changeDescription}
							maxLength={5000}
							required
							rows={7}
							placeholder="Ceritakan masalah, solusi, target pengguna, perkembangan, dan hal yang ingin didiskusikan."
						/>
						<small>{description.length}/5.000 karakter</small>
					</label>
					<div className="row spread wrap">
						<span className="helper">
							{dirty
								? "Ada perubahan yang belum disimpan."
								: work
									? `Terakhir disimpan ${formatDate(work.updated_at, true)}`
									: "Belum ada identitas karya tersimpan."}
						</span>
						<div className="actions">
							<button
								className="button secondary"
								type="submit"
								name="intent"
								value="draft"
								formNoValidate
								disabled={pending}
							>
								Simpan draf
							</button>
							<button
								className="button"
								type="submit"
								name="intent"
								value="ready"
								disabled={pending}
							>
								{pending ? "Menyimpan…" : "Simpan perubahan"}
							</button>
						</div>
					</div>
					{state.error && (
						<p className="notice danger" role="alert">
							{state.error}
						</p>
					)}
					{state.success && (
						<p className="notice" role="status">
							{state.success}
						</p>
					)}
				</form>
			</Panel>
		</div>
	);
}
