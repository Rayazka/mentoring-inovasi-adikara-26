// TODO: Pertahankan konteks pilihan jadwal saat peserta kembali melengkapi Identitas Karya.
"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { teamForUser, workIsReady } from "@/models/demo/selectors";
import { Button, EmptyState, Panel } from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";
import { registerDemoView } from "./registry";

/** Meninjau mentor, slot dan snapshot karya tanpa meminta peserta mengetik ulang topik. */
export function RequestSubmit({ controller }: { controller: DemoController }) {
	const { state, actor, dispatch } = controller;
	const params = useSearchParams();
	const router = useRouter();
	const [submissionKey] = useState(
		/** Membuat identitas tetap untuk percobaan ulang selama formulir yang sama masih terbuka. */
		function submissionIdentity() {
			return crypto.randomUUID();
		},
	);
	const mentorId = params.get("mentor") ?? "";
	const slotId = params.get("slot") ?? "";
	/** Mengirim pengajuan melalui controller yang memvalidasi ulang hak ketua dan slot. */
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (dispatch("request.submit", { mentorId, slotId, submissionKey }))
			router.push("/peserta/pengajuan");
	}
	if (!state || !actor) return null;
	const team = teamForUser(state, actor.id);
	const mentor = state.mentors.find(
		/** Mengambil profil mentor yang diteruskan dari langkah pemilihan jadwal. */
		function selectedMentor(item) {
			return item.id === mentorId && item.active && !item.archived;
		},
	);
	const slot = state.slots.find(
		/** Memastikan slot pada URL tetap sesuai dengan mentor yang ditinjau. */
		function selectedSlot(item) {
			return item.id === slotId && item.mentorId === mentorId;
		},
	);
	const work = state.works.find(
		/** Memuat karya milik tim aktif alih-alih menerima karya dari URL. */
		function teamWork(item) {
			return item.teamId === team?.id;
		},
	);
	if (!mentor || !slot)
		return (
			<Panel>
				<EmptyState
					title="Pilih mentor dan jadwal terlebih dahulu"
					description="Pilihan jadwal pada tautan ini tidak ditemukan."
					icon="calendar"
				>
					<Link className="button" href="/peserta/mentor">
						Cari mentor
					</Link>
				</EmptyState>
			</Panel>
		);
	return (
		<>
			<Link className="text-link" href={`/peserta/mentor/${mentorId}`}>
				← Kembali ke mentor
			</Link>
			<div className="section-heading">
				<div>
					<span className="eyebrow">SATU LANGKAH LAGI</span>
					<h1>Tinjau Pengajuan Mentoring</h1>
					<p>Pastikan karya dan jadwal timmu sudah sesuai sebelum dikirim.</p>
				</div>
			</div>
			<div className="grid-2">
				<Panel title="Mentor & jadwal" icon="calendar">
					<dl className="info-grid">
						<dt>Mentor</dt>
						<dd>{mentor.name}</dd>
						<dt>Bidang</dt>
						<dd>{mentor.expertise}</dd>
						<dt>Tanggal</dt>
						<dd>{formatDate(slot.date)}</dd>
						<dt>Sesi</dt>
						<dd>
							{slot.start}–{slot.end} WIB
						</dd>
						<dt>Jeda sampai</dt>
						<dd>{slot.bufferEnd} WIB</dd>
						<dt>Tim</dt>
						<dd>{team?.name ?? "Belum memiliki tim"}</dd>
					</dl>
				</Panel>
				<Panel title="Identitas Karya" icon="file">
					<div className="stack">
						<h3>{work?.title || "Judul belum diisi"}</h3>
						<p>{work?.description || "Deskripsi belum diisi"}</p>
						<Link className="text-link" href="/peserta/karya#judul-topik">
							Perbaiki identitas karya
						</Link>
						<p className="helper">
							Setelah memperbaiki karya, kembali ke halaman ini melalui tombol
							kembali browser untuk mempertahankan pilihan mentor dan jadwal.
						</p>
						<h3>Bahan pendukung</h3>
						{state.documents
							.filter(
								/** Menampilkan hanya dokumen tim aktif sebagai bahan pengajuan. */
								function teamDocument(item) {
									return item.teamId === team?.id;
								},
							)
							.map(
								/** Menyajikan nama bahan sebelum peserta mengirim snapshot pengajuan. */
								function documentItem(item) {
									return (
										<div className="subtle-box" key={item.id}>
											{item.title} ·{" "}
											{item.kind === "drive" ? "Link Drive" : item.filename}
										</div>
									);
								},
							)}
						{!state.documents.some(
							/** Menentukan pesan ketika tim belum menambahkan berkas atau link. */
							function hasDocument(item) {
								return item.teamId === team?.id;
							},
						) && (
							<p className="helper">
								Belum ada bahan pendukung. Mentor dapat meminta tambahan melalui
								revisi.
							</p>
						)}
					</div>
				</Panel>
			</div>
			<Panel>
				<form className="stack" onSubmit={submit}>
					<p className="notice warning">
						Pengajuan menunggu respons belum mengunci jadwal. Mentor akan
						menyetujui, menolak, atau meminta revisi.
					</p>
					{!team ? (
						<Link className="button" href="/peserta/tim">
							Bentuk tim terlebih dahulu
						</Link>
					) : team.leaderId !== actor.id ? (
						<p>Pengajuan hanya dapat dikirim oleh ketua tim.</p>
					) : !workIsReady(state, team.id) ? (
						<Link className="button" href="/peserta/karya#judul-topik">
							Lengkapi Identitas Karya
						</Link>
					) : (
						<>
							<label className="row">
								<input type="checkbox" required />
								Saya sudah memeriksa identitas karya, bahan, dan pilihan jadwal
								tim.
							</label>
							<Button type="submit">Kirim pengajuan</Button>
						</>
					)}
				</form>
			</Panel>
		</>
	);
}
registerDemoView("/peserta/pengajuan/baru", RequestSubmit);
