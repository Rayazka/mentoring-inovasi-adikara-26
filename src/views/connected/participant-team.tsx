// TODO: Pertahankan ringkasan qZHSE dan hitungan tab sesuai transaksi anggota terbaru.
import Link from "next/link";
import {
	createParticipantTeam,
	requestParticipantJoin,
} from "@/controllers/connected/team-actions";
import { teamCategories, type TeamPageData } from "@/models/connected/team";
import { Avatar, Badge, EmptyState, Panel } from "@/views/components/ui";
import { MutationForm } from "./mutation-form";
import { IncomingTeamRequests } from "./team-requests";

/** Menyajikan struktur Tim Saya yang disepakati menggunakan data Supabase dan proyeksi pencarian aman. */
export function ConnectedTeamPage({ data }: { data: TeamPageData }) {
	if (data.error)
		return (
			<Panel title="Tim belum dapat dimuat">
				<p role="alert">
					Periksa koneksi lalu coba muat ulang. Data tim tidak dihapus.
				</p>
				<Link className="button secondary" href="/peserta/tim">
					Coba lagi
				</Link>
			</Panel>
		);
	const { team } = data;
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">BERKARYA BERSAMA</span>
					<h2>Tim Saya</h2>
					<p>
						Satu visi, maksimal tiga orang. Mulai langkah inovasimu bersama tim.
					</p>
				</div>
			</div>
			{team ? (
				<>
					<nav className="local-navigation" aria-label="Bagian Tim Saya">
						<Link
							className={data.tab === "summary" ? "is-active" : ""}
							href="?tab=summary"
						>
							Ringkasan Tim
						</Link>
						<Link
							className={data.tab === "members" ? "is-active" : ""}
							href="?tab=members"
						>
							Anggota <span className="count">{data.members.length}</span>
						</Link>
						{team.leader_id === data.userId && (
							<Link
								href="?tab=requests"
								className={data.tab === "requests" ? "is-active" : ""}
							>
								Permintaan Bergabung{" "}
								<span className="count">{data.incoming.length}</span>
							</Link>
						)}
					</nav>
					{data.tab === "requests" ? (
						<IncomingTeamRequests
							requests={data.incoming}
							full={data.members.length >= 3}
						/>
					) : (
						<>
							<section
								className="crimson-summary"
								id="ringkasan-tim"
								aria-label="Profil tim"
							>
								<div className="row spread wrap">
									<div>
										<h2>{team.name}</h2>
										<p>Inovasi · {team.category}</p>
									</div>
									<Badge
										label={
											team.leader_id === data.userId
												? "Kamu ketua tim"
												: "Kamu anggota tim"
										}
									/>
								</div>
								<p>{team.description}</p>
								<strong>{data.members.length} dari 3 anggota</strong>
							</section>
							<div className="team-columns">
								<Panel title="Anggota Tim">
									<div className="team-members" id="anggota-tim">
										{data.members.map(
											/** Menampilkan anggota aktif tanpa membocorkan kontak pribadi. */
											function member(item) {
												return (
													<div className="member-row" key={item.user_id}>
														<Avatar name={item.full_name} />
														<div className="member-copy">
															<strong>
																{item.full_name}
																{item.user_id === data.userId ? " · kamu" : ""}
															</strong>
															<small>
																{item.user_id === team.leader_id
																	? "Mengelola tim dan pengajuan mentoring"
																	: "Anggota tim"}
															</small>
														</div>
														{item.user_id === team.leader_id && (
															<Badge label="Ketua tim" />
														)}
													</div>
												);
											},
										)}
									</div>
								</Panel>
								<Panel title="Langkah Selanjutnya">
									<p>
										Siapkan judul, deskripsi, dan bahan karya bersama tim untuk
										pengajuan mentoring.
									</p>
									<p className="muted">
										Pastikan seluruh anggota memahami topik yang akan
										didiskusikan.
									</p>
								</Panel>
							</div>
						</>
					)}
				</>
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
							<MutationForm
								action={createParticipantTeam}
								submit="Buat tim"
								fields={[
									{
										name: "name",
										label: "Nama tim",
										required: true,
										maxLength: 80,
									},
									{
										name: "category",
										label: "Kategori",
										type: "select",
										options: teamCategories,
										required: true,
									},
									{
										name: "description",
										label: "Deskripsi tim",
										type: "textarea",
										maxLength: 500,
									},
								]}
							/>
						</Panel>
						<Panel title="Cari tim" icon="search">
							<div className="stack">
								<form className="stack" method="get">
									<label className="field">
										Nama atau kategori
										<input
											name="q"
											type="search"
											defaultValue={data.query}
											maxLength={100}
											placeholder="Cari tim yang cocok"
										/>
									</label>
									<button type="submit" className="button secondary">
										Cari tim
									</button>
								</form>
								{data.publicTeams.length ? (
									data.publicTeams.map(
										/** Menampilkan hanya nama, kategori, deskripsi publik, serta kapasitas tim tujuan. */
										function publicTeam(item) {
											const pending = data.requests.some(
												/** Mencegah form permintaan ganda ketika pengajuan sebelumnya masih menunggu. */
												function pendingRequest(request) {
													return (
														request.team_id === item.id &&
														request.status === "pending"
													);
												},
											);
											return (
												<article
													className="subtle-box stack compact"
													key={item.id}
												>
													<div className="row spread">
														<h3>{item.name}</h3>
														<Badge label={`${item.member_count}/3`} />
													</div>
													<span className="tag">{item.category}</span>
													<p>{item.description}</p>
													{pending ? (
														<p className="notice" role="status">
															Menunggu persetujuan ketua
														</p>
													) : item.member_count >= 3 ? (
														<Badge label="Tim penuh" />
													) : (
														<details>
															<summary>Ajukan bergabung</summary>
															<MutationForm
																action={requestParticipantJoin}
																submit="Kirim permintaan"
																fields={[
																	{
																		name: "team",
																		label: "Tim",
																		type: "hidden",
																		value: item.id,
																	},
																	{
																		name: "note",
																		label: "Perkenalan singkat",
																		type: "textarea",
																		required: true,
																		maxLength: 500,
																	},
																]}
															/>
														</details>
													)}
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
						{data.requests.length ? (
							data.requests.map(
								/** Menampilkan riwayat permintaan akun sendiri tanpa menganggap pending sebagai keanggotaan. */
								function request(item) {
									const target = data.publicTeams.find(
										/** Mencocokkan nama tim dari hasil publik yang tersedia. */
										function targetTeam(candidate) {
											return candidate.id === item.team_id;
										},
									);
									return (
										<article className="subtle-box stack compact" key={item.id}>
											<strong>{target?.name ?? "Tim tujuan"}</strong>
											<p>{item.note}</p>
											<Badge
												label={
													item.status === "pending"
														? "Menunggu persetujuan"
														: item.status === "accepted"
															? "Diterima"
															: "Ditolak"
												}
											/>
										</article>
									);
								},
							)
						) : (
							<p>Belum ada permintaan bergabung.</p>
						)}
					</Panel>
				</div>
			)}
		</>
	);
}
