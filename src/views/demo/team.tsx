// TODO: Pertahankan data pencarian publik terpisah dari identitas karya tim yang bersifat privat.
"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import Link from "next/link";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { actorTeam } from "@/controllers/demo/context";
import {
	Avatar,
	Badge,
	Button,
	EmptyState,
	Icon,
	Modal,
	Panel,
} from "@/views/components/ui";
import { registerDemoView } from "./registry";
import { TeamReview } from "./team-review";
import { TeamMembership } from "./team-membership";

/** Menyajikan tim aktif atau pencarian dan pembuatan tim untuk peserta yang belum bergabung. */
export function TeamPage({ controller }: { controller: DemoController }) {
	const { state, actor, dispatch } = controller;
	const [search, setSearch] = useState("");
	const [joinId, setJoinId] = useState("");
	if (!state || !actor) return null;
	const team = actorTeam(state, actor);
	/** Mengubah pencarian berdasarkan nama, kategori, atau deskripsi publik tim. */
	function searchTeams(event: ChangeEvent<HTMLInputElement>) {
		setSearch(event.target.value);
	}
	/** Menutup dialog permintaan bergabung. */
	function closeJoin() {
		setJoinId("");
	}
	/** Mengirim data tim baru kepada controller tanpa mengubah penyimpanan dari view. */
	function create(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		dispatch("team.create", {
			name: form.get("name"),
			category: form.get("category"),
			description: form.get("description"),
		});
	}
	/** Mengajukan bergabung dengan pesan perkenalan untuk ditinjau ketua tim. */
	function join(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (dispatch("team.join", { teamId: joinId, note: form.get("note") }))
			setJoinId("");
	}
	const matches = state.teams.filter(
		/** Mencocokkan kata pencarian hanya terhadap informasi publik tim. */
		function publicMatch(item) {
			return `${item.name} ${item.category} ${item.description}`
				.toLocaleLowerCase("id-ID")
				.includes(search.toLocaleLowerCase("id-ID"));
		},
	);
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">BERKARYA BERSAMA</span>
					<h1>Tim Saya</h1>
					<p>
						Satu visi, maksimal tiga orang. Mulai langkah inovasimu bersama tim.
					</p>
				</div>
			</div>
			{team ? (
				<div className="stack">
					<Panel
						title={team.name}
						icon="team"
						actions={
							<Badge
								label={`${team.memberIds.length}/3 anggota`}
								tone="success"
							/>
						}
					>
						<div className="stack">
							<span className="tag">{team.category}</span>
							<p>{team.description}</p>
							<div className="stack compact">
								{team.memberIds.map(
									/** Menampilkan anggota tim yang sama tanpa mengungkap kontak pribadi. */
									function teamMember(id) {
										const user = state.users.find(
											/** Mengambil nama anggota dari fixture akun yang dikenal. */
											function memberAccount(item) {
												return item.id === id;
											},
										);
										return (
											<div className="member-row" key={id}>
												<div className="row">
													<Avatar name={user?.name ?? "Anggota"} />
													<div>
														<strong>{user?.name}</strong>
														<small>
															{id === actor.id ? "Kamu" : "Anggota tim"}
														</small>
													</div>
												</div>
												<Badge
													label={id === team.leaderId ? "Ketua" : "Anggota"}
												/>
											</div>
										);
									},
								)}
							</div>
							<Link href="/peserta/karya" className="button secondary">
								Lengkapi Identitas Karya <Icon name="arrow" />
							</Link>
						</div>
					</Panel>
					<TeamReview controller={controller} team={team} />
					<TeamMembership controller={controller} team={team} />
				</div>
			) : (
				<div className="stack">
					<Panel>
						<EmptyState
							title="Kamu belum memiliki tim"
							description="Buat tim sebagai ketua atau ajukan bergabung ke tim yang tersedia. Permintaan bergabung belum menjadikanmu anggota."
							icon="team"
						/>
					</Panel>
					<div className="grid-2">
						<Panel title="Buat tim baru" icon="plus">
							<form className="stack" onSubmit={create}>
								<label className="field">
									Nama tim
									<input
										name="name"
										required
										maxLength={80}
										placeholder="Contoh: Nusa Inovasi"
									/>
								</label>
								<label className="field">
									Kategori
									<select name="category" required>
										<option>UI/UX</option>
										<option>Softdev</option>
										<option>IoT</option>
										<option>Gamedev</option>
									</select>
								</label>
								<label className="field">
									Deskripsi tim
									<textarea
										name="description"
										required
										maxLength={500}
										placeholder="Ceritakan fokus tim dan anggota yang kamu cari."
									/>
								</label>
								<Button type="submit">
									Buat tim <Icon name="plus" />
								</Button>
							</form>
						</Panel>
						<Panel title="Cari tim" icon="search">
							<div className="stack">
								<label className="field">
									Nama atau kategori
									<input
										type="search"
										value={search}
										onChange={searchTeams}
										placeholder="Cari tim yang cocok"
									/>
								</label>
								{matches.length ? (
									matches.map(
										/** Menampilkan ringkasan publik dan status permintaan milik pencari. */
										function publicTeam(item) {
											const pending = state.joins.some(
												/** Memeriksa apakah akun ini telah meminta bergabung ke tim tersebut. */
												function pendingJoin(request) {
													return (
														request.teamId === item.id &&
														request.userId === actor.id &&
														request.status === "pending"
													);
												},
											);
											const full = item.memberIds.length >= 3;
											/** Membuka form perkenalan khusus untuk tim yang dipilih. */
											function openJoin() {
												setJoinId(item.id);
											}
											return (
												<article
													className="subtle-box stack compact"
													key={item.id}
												>
													<div className="row spread">
														<h3>{item.name}</h3>
														<Badge label={`${item.memberIds.length}/3`} />
													</div>
													<span className="tag">{item.category}</span>
													<p>{item.description}</p>
													<Button
														variant="secondary"
														disabled={pending || full}
														onClick={openJoin}
													>
														{pending
															? "Menunggu persetujuan"
															: full
																? "Tim penuh"
																: "Ajukan bergabung"}
													</Button>
												</article>
											);
										},
									)
								) : (
									<EmptyState
										title="Tim tidak ditemukan"
										description="Coba kata kunci lain atau buat tim sendiri."
										icon="search"
									/>
								)}
							</div>
						</Panel>
					</div>
					<Panel title="Permintaan bergabung saya">
						<div className="stack compact">
							{state.joins
								.filter(
									/** Mengambil hanya riwayat permintaan bergabung akun aktif. */
									function ownJoin(item) {
										return item.userId === actor.id;
									},
								)
								.map(
									/** Menyampaikan status permintaan tanpa membuka informasi privat tim tujuan. */
									function joinHistory(item) {
										const target = state.teams.find(
											/** Mencari nama tim untuk riwayat permintaan bergabung. */
											function targetName(value) {
												return value.id === item.teamId;
											},
										);
										return (
											<div className="list-row" key={item.id}>
												<strong>
													{target?.name ?? "Tim sudah dibubarkan"}
												</strong>
												<Badge
													label={
														item.status === "pending"
															? "Menunggu"
															: item.status === "accepted"
																? "Diterima"
																: "Ditolak"
													}
													tone={
														item.status === "accepted" ? "success" : "warning"
													}
												/>
											</div>
										);
									},
								)}
							{!state.joins.some(
								/** Menentukan apakah riwayat pengguna masih kosong. */
								function hasHistory(item) {
									return item.userId === actor.id;
								},
							) && <p>Belum ada permintaan bergabung.</p>}
						</div>
					</Panel>
				</div>
			)}
			<Modal
				open={Boolean(joinId)}
				title="Ajukan bergabung"
				onClose={closeJoin}
			>
				<form className="stack" onSubmit={join}>
					<p>
						Perkenalkan dirimu. Ketua akan menerima atau menolak permintaan ini.
					</p>
					<label className="field">
						Pesan perkenalan
						<textarea
							name="note"
							required
							maxLength={500}
							placeholder="Keahlian dan kontribusi yang ingin kamu bawa…"
						/>
					</label>
					<div className="actions">
						<Button variant="neutral" onClick={closeJoin}>
							Batal
						</Button>
						<Button type="submit">Kirim permintaan</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}

registerDemoView("/peserta/tim", TeamPage);
