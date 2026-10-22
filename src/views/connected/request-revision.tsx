// TODO: Pertahankan catatan awal saat ketua memperbaiki karya dan memilih bahan revisi.
"use client";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import type { loadRequestRevision } from "@/controllers/connected/request-revision";
import { formatWib } from "@/models/connected/operations";
import { Panel } from "@/views/components/ui";
import { SubmissionForm } from "./submission-form";

/** Menyajikan perbaikan dan kirim ulang sebagai dua langkah terpisah milik ketua. */
export function RequestRevision({
	requestId,
	originalSlot,
	kind,
	data,
}: {
	requestId: string;
	originalSlot: string;
	kind: string | null;
	data: Awaited<ReturnType<typeof loadRequestRevision>>;
}) {
	const [slot, setSlot] = useState(
		data.slots.some(
			/** Mempertahankan jadwal lama hanya ketika slotnya masih tersedia. */
			function original(item) {
				return item.id === originalSlot;
			},
		)
			? originalSlot
			: (data.slots[0]?.id ?? ""),
	);
	/** Memilih jadwal revisi yang akan diperiksa ulang saat transaksi. */
	function selectSlot(event: ChangeEvent<HTMLSelectElement>) {
		setSlot(event.target.value);
	}
	return (
		<Panel title="Perbaiki dan kirim ulang">
			<div className="stack">
				<p>
					Bagian yang perlu diperbaiki:{" "}
					{kind === "work"
						? "identitas karya dan bahan"
						: kind === "schedule"
							? "jadwal mentoring"
							: "karya dan jadwal"}
					. Menyimpan karya tidak otomatis mengirim ulang pengajuan.
				</p>
				<div className="row wrap">
					<Link
						href="/peserta/karya#informasi-karya"
						className="button secondary"
					>
						Perbaiki karya
					</Link>
					<Link
						href="/peserta/karya#dokumen-pendukung"
						className="button secondary"
					>
						Perbaiki bahan
					</Link>
				</div>
				{data.work && (
					<div className="subtle-box">
						<strong>Karya terbaru: {data.work.title || "Belum diisi"}</strong>
						<p style={{ whiteSpace: "pre-wrap" }}>{data.work.description}</p>
					</div>
				)}
				{!data.ready ? (
					<p className="notice warning">
						Lengkapi judul dan deskripsi lalu simpan karya sebelum mengirim
						ulang.
					</p>
				) : !data.slots.length ? (
					<p className="notice warning">
						Belum ada jadwal tersedia dari mentor yang sama. Hubungi admin atau
						batalkan pengajuan untuk memilih mentor lain.
					</p>
				) : (
					<>
						<label className="field">
							Jadwal yang diajukan kembali
							<select value={slot} onChange={selectSlot}>
								{data.slots.map(
									/** Menampilkan pilihan waktu aktual untuk mentor yang sama. */
									function option(item) {
										return (
											<option key={item.id} value={item.id}>
												{formatWib(item.starts_at)}
											</option>
										);
									},
								)}
							</select>
						</label>
						<SubmissionForm
							slotId={slot}
							submissionKey={requestId}
							requestId={requestId}
							documents={data.documents}
						/>
					</>
				)}
			</div>
		</Panel>
	);
}
