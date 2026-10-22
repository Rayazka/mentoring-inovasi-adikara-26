// TODO: Pertahankan ringkasan tim sesuai referensi T01 tanpa memasukkan fixture desain sebagai data nyata.
"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { Team } from "@/models/demo/types";
import {
	Avatar,
	Badge,
	Button,
	EmptyState,
	Icon,
	Modal,
	Panel,
} from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";
import { TeamMembership } from "./team-membership";

/** Menyajikan ringkasan, anggota dan permintaan tim melalui navigasi lokal yang berfungsi. */
export function TeamSummary({
	controller,
	team,
}: {
	controller: DemoController;
	team: Team;
}) {
	const { state, actor, dispatch } = controller;
	const [tab, setTab] = useState("summary");
	const [edit, setEdit] = useState(false);
	if (!state || !actor) return null;
	const leader = team.leaderId === actor.id;
	const work = state.works.find(
		/** Mengambil identitas karya milik tim aktif. */
		function teamWork(item) {
			return item.teamId === team.id;
		},
	);
	const documents = state.documents.filter(
		/** Menghitung bahan yang benar-benar sudah ditambahkan tim. */
		function ownedDocument(item) {
			return item.teamId === team.id;
		},
	);
	const joins = state.joins.filter(
		/** Menampilkan permintaan yang belum diputuskan untuk tim aktif. */
		function pendingJoin(item) {
			return item.teamId === team.id && item.status === "pending";
		},
	);
	/** Membuka pengelolaan anggota dan kepemimpinan. */
	function showMembers() {
		setTab("members");
	}
	/** Membuka dialog penggantian nama khusus ketua. */
	function openEdit() {
		setEdit(true);
	}
	/** Menutup dialog tanpa menyimpan perubahan. */
	function closeEdit() {
		setEdit(false);
	}
	/** Mengirim nama baru ke controller dan menutup dialog setelah berhasil. */
	function rename(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		if (dispatch("team.rename", { teamId: team.id, name: data.get("name") }))
			closeEdit();
	}
	return (
		<>
			<nav className="local-navigation" aria-label="Bagian Tim Saya">
				{[
					{ id: "summary", label: "Ringkasan Tim" },
					{ id: "members", label: "Anggota", count: team.memberIds.length },
					...(leader
						? [
								{
									id: "requests",
									label: "Permintaan Bergabung",
									count: joins.length,
								},
							]
						: []),
				].map(
					/** Memasang tombol bagian dengan jumlah dari data tim terkini. */
					function teamTab(item) {
						/** Mengaktifkan bagian tim yang dipilih pengguna. */
						function selectTab() {
							setTab(item.id);
						}
						return (
							<button
								type="button"
								key={item.id}
								className={tab === item.id ? "is-active" : ""}
								aria-pressed={tab === item.id}
								onClick={selectTab}
							>
								{item.label}
								{item.count !== undefined && (
									<span className="count">{item.count}</span>
								)}
							</button>
						);
					},
				)}
			</nav>
			{tab !== "requests" && (
				<>
					<section className="crimson-summary" aria-label="Profil tim">
						<div className="row spread wrap">
							<div>
								<h2>{team.name}</h2>
								<p>Inovasi · {team.category}</p>
							</div>
							<Badge label={leader ? "Kamu ketua tim" : "Kamu anggota tim"} />
							{leader && <Button onClick={openEdit}>Edit Nama Tim</Button>}
						</div>
						<p>{team.description}</p>
						<div className="row wrap">
							<strong>{team.memberIds.length} dari 3 anggota</strong>
							<span>
								Ketua:{" "}
								{
									state.users.find(
										/** Menampilkan nama pemimpin tim saat ini. */
										function teamLeader(user) {
											return user.id === team.leaderId;
										},
									)?.name
								}
							</span>
						</div>
					</section>
					<div className="team-columns">
						<Panel
							title="Anggota Tim"
							actions={
								<div className="row">
									<span>{team.memberIds.length}/3</span>
									<Button variant="secondary" onClick={showMembers}>
										Edit
									</Button>
								</div>
							}
						>
							<div className="team-members">
								{team.memberIds.map(
									/** Menampilkan setiap anggota aktif beserta tanggung jawabnya. */
									function memberRow(id) {
										const user = state.users.find(
											/** Mencocokkan akun anggota untuk nama dan avatar. */
											function memberAccount(item) {
												return item.id === id;
											},
										);
										return (
											<div key={id} className="member-row">
												<Avatar name={user?.name ?? "Anggota"} />
												<div className="member-copy">
													<strong>
														{user?.name}
														{id === actor.id ? " · kamu" : ""}
													</strong>
													<small>
														{id === team.leaderId
															? "Mengelola tim dan pengajuan mentoring"
															: "Dapat melihat karya, dokumen, dan jadwal tim"}
													</small>
												</div>
												{id === team.leaderId && <Badge label="Ketua tim" />}
											</div>
										);
									},
								)}
								<div className="team-capacity">
									<Icon name="team" />
									<div>
										<strong>
											{team.memberIds.length < 3
												? `Masih ada ${3 - team.memberIds.length} tempat`
												: "Tim sudah lengkap"}
										</strong>
										<small>Maksimal tiga orang, termasuk ketua.</small>
									</div>
								</div>
							</div>
						</Panel>
						<Panel title="Identitas Karya" className="team-work">
							<div className="stack compact">
								<h3>{work?.title || "Identitas karya belum diisi"}</h3>
								<p>
									Judul, deskripsi, serta bahan diskusi tim dikelola di
									Identitas Karya.
								</p>
								<small>
									{
										documents.filter(
											/** Menghitung berkas yang sudah tersimpan. */
											function fileDocument(item) {
												return item.kind === "file";
											},
										).length
									}{" "}
									file ·{" "}
									{
										documents.filter(
											/** Menghitung tautan Drive milik tim. */
											function driveDocument(item) {
												return item.kind === "drive";
											},
										).length
									}{" "}
									link Google Drive
								</small>
								<Link href="/peserta/karya" className="button secondary">
									Lihat Identitas Karya
								</Link>
							</div>
						</Panel>
					</div>
				</>
			)}
			{tab === "members" && (
				<TeamMembership controller={controller} team={team} />
			)}
			{leader && tab !== "members" && (
				<Panel
					title="Permintaan Bergabung"
					actions={<Badge label={`${joins.length} menunggu`} tone="warning" />}
				>
					<div className="stack">
						<p>
							Tinjau calon anggota sebelum menerima. Kapasitas diperiksa kembali
							saat persetujuan.
						</p>
						{joins.length ? (
							joins.map(
								/** Menyajikan perkenalan dan tindakan keputusan bagi ketua tim. */
								function joinRow(join) {
									const user = state.users.find(
										/** Mengambil nama pemohon tanpa membuka data di luar tim. */
										function applicant(item) {
											return item.id === join.userId;
										},
									);
									/** Mengirim persetujuan yang tetap diperiksa kapasitasnya oleh controller. */
									function accept() {
										dispatch("team.review", { joinId: join.id, accept: true });
									}
									/** Mengirim penolakan permintaan bergabung. */
									function reject() {
										dispatch("team.review", { joinId: join.id, accept: false });
									}
									return (
										<div className="team-join-row" key={join.id}>
											<Avatar name={user?.name ?? "Peserta"} />
											<div className="team-join-copy">
												<h3>{user?.name}</h3>
												<p>{join.note}</p>
												<small>
													Diajukan {formatDate(join.createdAt, true)}
												</small>
											</div>
											<Button variant="secondary" onClick={reject}>
												Tolak
											</Button>
											<Button
												onClick={accept}
												disabled={team.memberIds.length >= 3}
											>
												Terima Permintaan
											</Button>
										</div>
									);
								},
							)
						) : (
							<EmptyState
								title="Belum ada permintaan baru"
								description="Permintaan calon anggota akan tampil di sini."
								icon="team"
							/>
						)}
						{joins.length > 0 && (
							<p className="notice warning">
								Setelah diterima, calon anggota mendapat akses ke karya tim. Tim
								maksimal tiga orang termasuk ketua.
							</p>
						)}
					</div>
				</Panel>
			)}
			<Modal open={edit} title="Edit Nama Tim" onClose={closeEdit}>
				<form className="stack" onSubmit={rename}>
					<label className="field">
						Nama tim
						<input
							name="name"
							defaultValue={team.name}
							maxLength={80}
							required
						/>
					</label>
					<div className="actions">
						<Button variant="neutral" onClick={closeEdit}>
							Batal
						</Button>
						<Button type="submit">Simpan Perubahan</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
