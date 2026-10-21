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
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">CERITAKAN INOVASIMU</span>
					<h1>Identitas Karya</h1>
					<p>
						Berikan gambaran kepada mentor tentang karya yang sedang timmu
						kembangkan.
					</p>
				</div>
				<Badge
					label={ready ? "Informasi lengkap" : "Perlu dilengkapi"}
					tone={ready ? "success" : "warning"}
				/>
			</div>
			<Panel title="Informasi Karya" icon="file">
				<form className="stack" onSubmit={save}>
					<p className="notice">
						Data ini dimiliki bersama oleh tim dan akan dipakai ulang saat
						mengajukan mentoring.
					</p>
					<label className="field" htmlFor="judul-topik">
						Judul topik <span aria-hidden="true">*</span>
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
						Deskripsi topik <span aria-hidden="true">*</span>
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
						<small>{description.length}/5.000 karakter</small>
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
							<Button variant="neutral" onClick={draft}>
								Simpan draf
							</Button>
							<Button type="submit">Simpan identitas karya</Button>
						</div>
					</div>
				</form>
			</Panel>
			<Panel title="Langkah berikutnya">
				<p>
					Pastikan gambaran karya sudah jelas sebelum memilih mentor yang sesuai
					bidangnya.
				</p>
				<Link className="button secondary" href="/peserta/mentor">
					Cari Mentor
				</Link>
			</Panel>
		</>
	);
}
registerDemoView("/peserta/karya", WorkPage);
