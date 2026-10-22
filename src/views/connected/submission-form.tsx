// TODO: Pertahankan pilihan dokumen dan kunci pengiriman ketika jaringan gagal.
"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { submitParticipantRequest } from "@/controllers/connected/submission-actions";
import type { TeamDocument } from "@/models/connected/document";

/** Mengirim pilihan bahan yang sudah ditinjau tanpa meminta peserta mengetik ulang topik karya. */
export function SubmissionForm({
	slotId,
	submissionKey,
	documents,
}: {
	slotId: string;
	submissionKey: string;
	documents: TeamDocument[];
}) {
	const [key] = useState(submissionKey);
	const [state, action, pending] = useActionState(submitParticipantRequest, {
		error: null,
	});
	const [selected, setSelected] = useState(
		documents.map(
			/** Memilih bahan yang telah siap sebagai nilai awal review. */
			function id(item) {
				return item.id;
			},
		),
	);
	return (
		<form action={action} className="stack">
			<input type="hidden" name="slot" value={slotId} />
			<input type="hidden" name="key" value={key} />
			<fieldset
				disabled={pending || Boolean(state.requestId)}
				className="stack"
				style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
			>
				<legend>Bahan yang disertakan</legend>
				{documents.length ? (
					documents.map(
						/** Menyajikan pilihan dokumen yang akan direkam pada snapshot pengajuan. */
						function document(item) {
							/** Mempertahankan pilihan bahan saat submit gagal tanpa menggunakan penyimpanan browser. */
							function toggle() {
								setSelected(
									selected.includes(item.id)
										? selected.filter(
												/** Menghapus hanya bahan yang dibatalkan pilihannya. */
												function other(id) {
													return id !== item.id;
												},
											)
										: [...selected, item.id],
								);
							}
							return (
								<label className="row" key={item.id}>
									<input
										type="checkbox"
										name="documents"
										value={item.id}
										checked={selected.includes(item.id)}
										onChange={toggle}
									/>
									{item.title}
									{item.inaccessible ? " · Periksa akses bahan" : ""}
								</label>
							);
						},
					)
				) : (
					<p>
						Belum ada bahan pendukung. Judul dan deskripsi karya tetap
						disertakan.
					</p>
				)}
				<button type="submit" className="button">
					{pending ? "Mengirim pengajuan…" : "Kirim pengajuan"}
				</button>
			</fieldset>
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
			{state.requestId && (
				<Link
					className="button secondary"
					href={`/peserta/pengajuan/${state.requestId}`}
				>
					Lihat pengajuan
				</Link>
			)}
		</form>
	);
}
