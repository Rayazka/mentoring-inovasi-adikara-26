// TODO: Pertahankan arsip sebagai operasi yang menjaga seluruh riwayat pengajuan mentor.
"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import type { Mentor } from "@/models/demo/types";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import {
	Avatar,
	Badge,
	Button,
	EmptyState,
	Modal,
	Panel,
} from "@/views/components/ui";
import { registerDemoView } from "./registry";

/** Menampilkan daftar dan CRUD mentor dengan konfirmasi arsip serta filter profil aktif. */
export function AdminMentors({ controller }: { controller: DemoController }) {
	const { state, dispatch } = controller;
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState("semua");
	const [editing, setEditing] = useState<Mentor | "new" | null>(null);
	const [archiving, setArchiving] = useState<Mentor | null>(null);
	const [detail, setDetail] = useState<Mentor | null>(null);
	/** Mengubah kata pencarian nama atau bidang mentor. */
	function changeSearch(event: ChangeEvent<HTMLInputElement>) {
		setSearch(event.target.value);
	}
	/** Mengubah filter aktif, nonaktif atau arsip. */
	function changeFilter(event: ChangeEvent<HTMLSelectElement>) {
		setFilter(event.target.value);
	}
	/** Membuka formulir pembuatan profil tanpa akun. */
	function addMentor() {
		setEditing("new");
	}
	/** Menutup formulir profil tanpa menyimpan perubahan. */
	function closeEdit() {
		setEditing(null);
	}
	/** Menutup dialog konfirmasi arsip. */
	function closeArchive() {
		setArchiving(null);
	}
	/** Menutup detail profil. */
	function closeDetail() {
		setDetail(null);
	}
	/** Mengirim data profil tervalidasi kepada controller admin. */
	function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			dispatch("mentor.save", {
				id: editing && editing !== "new" ? editing.id : "",
				name: form.get("name"),
				title: form.get("title"),
				expertise: form.get("expertise"),
				bio: form.get("bio"),
				achievements: form.get("achievements"),
			})
		)
			closeEdit();
	}
	/** Mengarsipkan mentor hanya setelah controller memastikan tidak ada kegiatan aktif. */
	function archive() {
		if (archiving && dispatch("mentor.archive", { id: archiving.id }))
			closeArchive();
	}
	if (!state) return null;
	const items = state.mentors.filter(
		/** Menggabungkan filter status dengan pencarian nama dan bidang profil. */
		function matchingMentor(mentor) {
			const text = `${mentor.name} ${mentor.expertise}`
				.toLowerCase()
				.includes(search.toLowerCase());
			const status =
				filter === "semua" ||
				(filter === "arsip"
					? mentor.archived
					: !mentor.archived && mentor.active === (filter === "aktif"));
			return text && status;
		},
	);
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">ADMINISTRASI</span>
					<h1>Kelola Mentor</h1>
					<p>
						Kelola profil, status, dan akun mentor tanpa kehilangan riwayat
						mentoring.
					</p>
				</div>
				<Button onClick={addMentor}>Tambah mentor</Button>
			</div>
			<Panel>
				<div className="stack">
					<div className="filters">
						<label className="field">
							Cari mentor
							<input
								type="search"
								value={search}
								onChange={changeSearch}
								placeholder="Nama atau bidang"
							/>
						</label>
						<label className="field">
							Status
							<select value={filter} onChange={changeFilter}>
								<option value="semua">Semua status</option>
								<option value="aktif">Aktif</option>
								<option value="nonaktif">Nonaktif</option>
								<option value="arsip">Diarsipkan</option>
							</select>
						</label>
					</div>
					{items.length ? (
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Mentor</th>
										<th>Bidang</th>
										<th>Status</th>
										<th>Akun</th>
										<th>Tindakan</th>
									</tr>
								</thead>
								<tbody>
									{items.map(
										/** Menampilkan profil dan tindakan yang tetap diperiksa ulang oleh controller. */
										function mentorRow(mentor) {
											/** Membuka profil terpilih untuk diedit. */
											function edit() {
												setEditing(mentor);
											}
											/** Membuka profil lengkap mentor. */
											function openDetail() {
												setDetail(mentor);
											}
											/** Mengaktifkan atau menonaktifkan mentor dengan pemeriksaan kegiatan aktif. */
											function toggleStatus() {
												dispatch("mentor.status", {
													id: mentor.id,
													active: !mentor.active,
												});
											}
											/** Meminta konfirmasi sebelum mengarsipkan profil. */
											function requestArchive() {
												setArchiving(mentor);
											}
											return (
												<tr key={mentor.id}>
													<td>
														<div className="row">
															<Avatar name={mentor.name} size="small" />
															<div>
																<strong>{mentor.name}</strong>
																<small>{mentor.title}</small>
															</div>
														</div>
													</td>
													<td>{mentor.expertise}</td>
													<td>
														<Badge
															label={
																mentor.archived
																	? "Diarsipkan"
																	: mentor.active
																		? "Aktif"
																		: "Nonaktif"
															}
															tone={mentor.active ? "success" : ""}
														/>
													</td>
													<td>
														{mentor.userId ? (
															"Terhubung"
														) : (
															<Link className="text-link" href="/admin/akun">
																Belum ditautkan
															</Link>
														)}
													</td>
													<td>
														<div className="actions wrap">
															<Button
																variant="neutral"
																className="small"
																onClick={openDetail}
															>
																Detail
															</Button>
															{!mentor.archived && (
																<>
																	<Button
																		variant="secondary"
																		className="small"
																		onClick={edit}
																	>
																		Edit
																	</Button>
																	<Button
																		variant="neutral"
																		className="small"
																		onClick={toggleStatus}
																	>
																		{mentor.active ? "Nonaktifkan" : "Aktifkan"}
																	</Button>
																	<Button
																		variant="danger"
																		className="small"
																		onClick={requestArchive}
																	>
																		Arsipkan
																	</Button>
																</>
															)}
														</div>
													</td>
												</tr>
											);
										},
									)}
								</tbody>
							</table>
						</div>
					) : (
						<EmptyState
							title="Mentor tidak ditemukan"
							description="Ubah filter atau tambahkan mentor baru."
							icon="mentor"
						/>
					)}
				</div>
			</Panel>
			<Modal
				open={Boolean(editing)}
				title={editing === "new" ? "Tambah mentor" : "Edit mentor"}
				onClose={closeEdit}
			>
				{editing && (
					<form
						className="stack"
						onSubmit={save}
						key={editing === "new" ? "new" : editing.id}
					>
						<label className="field">
							Nama mentor
							<input
								name="name"
								required
								maxLength={100}
								defaultValue={editing === "new" ? "" : editing.name}
							/>
						</label>
						<label className="field">
							Title
							<input
								name="title"
								required
								maxLength={150}
								defaultValue={editing === "new" ? "" : editing.title}
							/>
						</label>
						<label className="field">
							Bidang
							<select
								name="expertise"
								defaultValue={editing === "new" ? "UI/UX" : editing.expertise}
							>
								<option>UI/UX</option>
								<option>Softdev</option>
								<option>IoT</option>
								<option>Gamedev</option>
							</select>
						</label>
						<label className="field">
							Biografi
							<textarea
								name="bio"
								required
								maxLength={3000}
								defaultValue={editing === "new" ? "" : editing.bio}
							/>
						</label>
						<label className="field">
							Pencapaian (satu per baris)
							<textarea
								name="achievements"
								maxLength={5000}
								defaultValue={
									editing === "new" ? "" : editing.achievements.join("\n")
								}
							/>
						</label>
						<div className="actions">
							<Button variant="neutral" onClick={closeEdit}>
								Batal
							</Button>
							<Button type="submit">Simpan mentor</Button>
						</div>
					</form>
				)}
			</Modal>
			<Modal
				open={Boolean(archiving)}
				title="Arsipkan mentor?"
				onClose={closeArchive}
			>
				<p>
					{archiving?.name} akan disembunyikan dari katalog dan akses mentornya
					dicabut. Pengajuan atau sesi aktif harus dituntaskan terlebih dahulu.
					Riwayat tetap tersimpan.
				</p>
				<div className="actions">
					<Button variant="neutral" onClick={closeArchive}>
						Batal
					</Button>
					<Button variant="danger" onClick={archive}>
						Arsipkan
					</Button>
				</div>
			</Modal>
			<Modal
				open={Boolean(detail)}
				title={detail?.name ?? "Detail mentor"}
				onClose={closeDetail}
			>
				{detail && (
					<div className="stack">
						<Avatar name={detail.name} size="large" />
						<h3>{detail.title}</h3>
						<span className="tag">{detail.expertise}</span>
						<p>{detail.bio}</p>
						<ul>
							{detail.achievements.map(
								/** Menampilkan pencapaian profil mentor yang dipilih. */
								function achievement(item, index) {
									return <li key={`${index}-${item}`}>{item}</li>;
								},
							)}
						</ul>
						<Link
							className="button secondary"
							href="/admin/jadwal"
							onClick={closeDetail}
						>
							Kelola jadwal mentor
						</Link>
					</div>
				)}
			</Modal>
		</>
	);
}
registerDemoView("/admin/mentor", AdminMentors);
