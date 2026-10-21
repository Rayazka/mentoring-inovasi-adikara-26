// TODO: Pertahankan input belum tersimpan ketika terjadi kegagalan penyimpanan karya.
"use client";
import Link from "next/link";
import { useState, type FormEvent, type ChangeEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { teamForUser, workIsReady } from "@/models/demo/selectors";
import {
	Badge,
	Button,
	EmptyState,
	Panel,
	formatDate,
} from "@/views/components/ui";
import { registerDemoView } from "./registry";
import { DocumentsPanel } from "./documents";
import { DrivePanel } from "./drive";

/** Memilih karya tim dari sesi aktif sebelum memasang formulir yang mempertahankan input lokal. */
export function WorkPage({ controller }: { controller: DemoController }) {
	const { state, actor } = controller;
	if (!state || !actor) return null;
	const team = teamForUser(state, actor.id);
	if (!team)
		return (
			<Panel title="Identitas Karya">
				<EmptyState
					title="Bentuk tim terlebih dahulu"
					description="Judul topik, deskripsi dan dokumen menjadi identitas karya milik tim."
					icon="team"
				>
					<Link className="button" href="/peserta/tim">
						Ke Tim Saya
					</Link>
				</EmptyState>
			</Panel>
		);
	return <WorkForm key={team.id} controller={controller} teamId={team.id} />;
}

/** Mengisi judul dan deskripsi satu kali untuk dipakai ulang pada pengajuan mentoring tim. */
function WorkForm({
	controller,
	teamId,
}: {
	controller: DemoController;
	teamId: string;
}) {
	const { state, dispatch } = controller;
	const work = state?.works.find(
		/** Mengambil identitas yang sudah tersimpan untuk nilai awal form. */
		function savedWork(item) {
			return item.teamId === teamId;
		},
	);
	const [title, setTitle] = useState(work?.title ?? "");
	const [description, setDescription] = useState(work?.description ?? "");
	const [dirty, setDirty] = useState(false);
	/** Memperbarui judul yang sedang diedit dan menandai perubahan belum tersimpan. */
	function changeTitle(event: ChangeEvent<HTMLInputElement>) {
		setTitle(event.target.value);
		setDirty(true);
	}
	/** Memperbarui gambaran topik yang sedang diedit. */
	function changeDescription(event: ChangeEvent<HTMLTextAreaElement>) {
		setDescription(event.target.value);
		setDirty(true);
	}
	/** Menyimpan judul dan deskripsi setelah validasi seluruh kolom wajib. */
	function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (dispatch("work.save", { title, description })) setDirty(false);
	}
	/** Mempertahankan pekerjaan parsial walaupun identitas belum lengkap. */
	function draft() {
		if (dispatch("work.draft", { title, description })) setDirty(false);
	}
	if (!state) return null;
	const ready = workIsReady(state, teamId);
	const team = state.teams.find(
		/** Mengambil nama tim pemilik identitas karya. */
		function workOwner(item) {
			return item.id === teamId;
		},
	);
	const documentCount = state.documents.filter(
		/** Menghitung seluruh bahan diskusi yang sudah tersimpan. */
		function workDocument(item) {
			return item.teamId === teamId;
		},
	).length;
	return (
		<>
			<nav className="local-navigation" aria-label="Bagian Identitas Karya">
				<a className="is-active" href="#informasi-karya">
					Informasi Karya
				</a>
				<a href="#dokumen-pendukung">
					Dokumen Pendukung <span className="count">{documentCount}</span>
				</a>
			</nav>
			<section className="crimson-summary" aria-label="Ringkasan karya">
				<div className="row spread wrap">
					<div>
						<h2>{work?.title || "Identitas karya belum diisi"}</h2>
						<p>
							Milik Tim {team?.name} · {team?.category}
						</p>
					</div>
					<Badge
						label={ready ? "Judul & deskripsi terisi" : "Perlu dilengkapi"}
					/>
				</div>
				<p>
					Informasi karya digunakan kembali saat mengajukan mentoring. Kamu
					tidak perlu menuliskannya ulang untuk setiap sesi.
				</p>
			</section>
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
					<form className="stack" onSubmit={save}>
						<p className="helper">
							Judul dan deskripsi wajib diisi agar mentor memahami arah karyamu.
						</p>
						<label className="field" htmlFor="judul-topik">
							<span>
								Judul topik <span aria-hidden="true">*</span>
							</span>
							<input
								id="judul-topik"
								name="title"
								value={title}
								onChange={changeTitle}
								maxLength={150}
								required
								placeholder="Apa judul atau topik karya timmu?"
							/>
							<small>
								Gunakan judul yang menggambarkan fokus karya tim. ·{" "}
								{title.length}/150 karakter
							</small>
						</label>
						<label className="field" htmlFor="deskripsi-topik">
							<span>
								Deskripsi topik <span aria-hidden="true">*</span>
							</span>
							<textarea
								id="deskripsi-topik"
								name="description"
								value={description}
								onChange={changeDescription}
								required
								maxLength={5000}
								rows={7}
								placeholder="Ceritakan masalah yang ingin diselesaikan, solusi, target pengguna, perkembangan saat ini, dan hal yang ingin didiskusikan."
							/>
							<small>
								Jelaskan gambaran ide, tujuan, dan masalah yang ingin
								diselesaikan. · {description.length}/5.000 karakter
							</small>
						</label>
						<div className="row spread wrap">
							<span className="helper">
								{dirty
									? "Ada perubahan yang belum disimpan."
									: work
										? `Terakhir disimpan ${formatDate(work.updatedAt, true)}`
										: "Belum ada identitas karya tersimpan."}
							</span>
							<div className="actions">
								<Button variant="secondary" onClick={draft}>
									Simpan draf
								</Button>
								<Button type="submit">Simpan Perubahan</Button>
							</div>
						</div>
					</form>
				</Panel>
			</div>
			<div id="dokumen-pendukung" className="work-documents">
				<Panel title="Dokumen Pendukung">
					<p>
						{documentCount} bahan diskusi milik tim. Tambahkan file atau tautan
						Google Drive untuk membantu mentor memahami karya.
					</p>
					<DocumentsPanel controller={controller} teamId={teamId} compact />
					<DrivePanel controller={controller} teamId={teamId} />
				</Panel>
			</div>
		</>
	);
}
registerDemoView("/peserta/karya", WorkPage);
