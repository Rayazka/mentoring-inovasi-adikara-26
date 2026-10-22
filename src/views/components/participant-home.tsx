// TODO: Bandingkan komponen presentasi bersama dengan Home V2 saat kontrak data berubah.
import Link from "next/link";
import type { ParticipantHomeViewModel } from "@/models/participant-home";
import {
	Avatar,
	Badge,
	Icon,
	MentorCard,
	Panel,
	ResourcePanel,
	formatDate,
} from "./ui";

/** Menampilkan Home V2 yang sama untuk data produksi dan demo tanpa mengakses penyimpanan. */
export function ParticipantHomeView({
	data,
}: {
	data: ParticipantHomeViewModel;
}) {
	const {
		actor,
		settings,
		users,
		resources,
		preview,
		team,
		work,
		request,
		slot,
		mentor,
		ready,
		files,
		links,
		joins,
		greeting,
		leader,
	} = data;
	const detail = request
		? `/peserta/pengajuan/${request.id}`
		: "/peserta/mentor";
	return (
		<div className="participant-home">
			<div className="home-mobile-greeting">
				<h1>Halo, {actor.name.split(" ")[0]}.</h1>
				<p>{greeting}</p>
			</div>
			<div className="home-event-info">
				<strong>
					{settings.dates
						.map(
							/** Menampilkan tanggal dari pengaturan admin tanpa hardcode tanggal desain. */
							function eventDate(day) {
								return formatDate(day);
							},
						)
						.join(" – ")}
				</strong>
				<span>
					{settings.start.replace(":", ".")}–{settings.end.replace(":", ".")}{" "}
					WIB
				</span>
				<small>
					{settings.sessionMinutes} menit sesi · {settings.bufferMinutes} menit
					jeda
				</small>
			</div>
			<Panel
				title="Mentoring Saya"
				className="home-mentoring"
				actions={
					request ? (
						<Badge status={request.status} />
					) : (
						<Badge label="Belum ada pengajuan" />
					)
				}
			>
				<div className="stack">
					{request ? (
						<>
							<div className="home-session-row">
								<div className="stack compact">
									<h2 className="home-work-title">{request.title}</h2>
									{mentor && (
										<div className="row">
											<Avatar name={mentor.name} photo={mentor.photo} />
											<div>
												<strong>{mentor.name}</strong>
												<small className="home-meta">
													{mentor.expertise} · Tim {team?.name} ·{" "}
													{request.code ?? request.id}
												</small>
											</div>
										</div>
									)}
								</div>
								{slot && (
									<aside className="schedule-summary">
										<small
											className={
												request.status === "approved" ? "home-confirmed" : ""
											}
										>
											{request.status === "approved"
												? "Jadwal terkonfirmasi"
												: "Jadwal yang diajukan"}
										</small>
										<strong>{formatDate(slot.date)}</strong>
										<b>
											{slot.start}–{slot.end} WIB
										</b>
										<small>
											{settings.sessionMinutes} menit sesi mentoring
										</small>
									</aside>
								)}
							</div>
							{request.status === "pending" && (
								<p className="home-state-note">
									Menunggu keputusan admin. Jadwal ini belum terkonfirmasi dan
									belum mengunci slot.
								</p>
							)}
							{request.note && (
								<p className="home-state-note">
									{request.status === "revision_requested"
										? "Catatan revisi: "
										: request.status === "rejected"
											? "Alasan penolakan: "
											: "Catatan terbaru: "}
									{request.note}
								</p>
							)}
							{request.status === "revision_requested" && !leader && (
								<p className="home-state-note">
									Ketua tim akan mengirim ulang revisi. Kamu tetap dapat membaca
									catatannya.
								</p>
							)}
							<div className="actions">
								{request.status === "approved" && request.meetingUrl && (
									<a
										className="button"
										href={request.meetingUrl}
										target="_blank"
										rel="noreferrer"
									>
										Buka Meeting
									</a>
								)}
								<Link
									className={`button ${request.status === "revision_requested" && leader ? "" : "secondary"}`}
									href={detail}
								>
									{request.status === "revision_requested" && leader
										? "Tinjau Revisi"
										: "Lihat Detail"}
								</Link>
								{["rejected", "cancelled", "completed"].includes(
									request.status,
								) && (
									<Link className="button secondary" href="/peserta/mentor">
										Pilih Mentor/Jadwal Lain
									</Link>
								)}
							</div>
						</>
					) : (
						<div className="home-empty-content">
							<h2>
								{!team
									? "Mulai perjalanan mentoringmu"
									: !ready
										? "Siapkan karya sebelum mentoring"
										: "Karyamu siap didiskusikan"}
							</h2>
							<p>
								{!team
									? "Buat atau gabung tim, lengkapi identitas karya, lalu pilih mentor yang sesuai."
									: !ready
										? "Lengkapi judul topik dan deskripsi agar mentor mendapatkan gambaran karya timmu."
										: "Temukan mentor dan jadwal yang sesuai untuk mempertajam arah inovasi timmu."}
							</p>
							<div className="actions">
								<Link
									className="button"
									href={
										!team
											? "/peserta/tim"
											: !ready
												? "/peserta/karya#judul-topik"
												: "/peserta/mentor"
									}
								>
									{!team
										? "Buat / Gabung Tim"
										: !ready
											? "Lengkapi Identitas Karya"
											: "Mulai Pengajuan"}
								</Link>
								<Link className="button secondary" href="/peserta/mentor">
									Jelajahi Mentor
								</Link>
							</div>
							<div className="checklist">
								<span className={team ? "done" : ""}>
									<Icon name={team ? "check" : "team"} />
									Tim terbentuk
								</span>
								<span className={ready ? "done" : ""}>
									<Icon name={ready ? "check" : "file"} />
									Identitas karya lengkap
								</span>
								<span>
									<Icon name="request" />
									Pengajuan mentoring
								</span>
							</div>
						</div>
					)}
				</div>
			</Panel>
			<div className="home-summary-grid">
				<Panel title="Tim Saya" icon="team" className="home-team">
					<div className="stack compact">
						{team ? (
							<>
								<div className="row spread">
									<h2>{team.name}</h2>
									<small>{team.memberIds.length}/3 anggota</small>
								</div>
								<div className="home-member-list">
									{team.memberIds.map(
										/** Menampilkan anggota aktif tim dan perannya dalam baris ringkas sesuai desain V2. */
										function memberRow(id) {
											const member = users.find(
												/** Mengambil nama akun anggota pada tim yang sama. */
												function memberAccount(user) {
													return user.id === id;
												},
											);
											return (
												<div className="row spread" key={id}>
													<div className="row">
														<Avatar
															name={member?.name ?? "Anggota"}
															size="small"
														/>
														<span>
															{member?.name}
															{id === actor.id ? " · kamu" : ""}
														</span>
													</div>
													<small>
														{id === team.leaderId ? "Ketua" : "Anggota"}
													</small>
												</div>
											);
										},
									)}
								</div>
								{leader && joins > 0 && (
									<small className="home-attention">
										{joins} permintaan bergabung belum ditangani
									</small>
								)}
								<div>
									<Link className="button secondary" href="/peserta/tim">
										{leader ? "Kelola Tim" : "Lihat Tim"}
									</Link>
								</div>
							</>
						) : (
							<>
								<h3>Belum memiliki tim</h3>
								<p>
									Bergabung atau bentuk tim beranggotakan maksimal tiga orang
									termasuk ketua.
								</p>
								<div className="actions">
									<Link className="button secondary" href="/peserta/tim">
										Buat Tim
									</Link>
									<Link className="text-link" href="/peserta/tim">
										Cari / Gabung Tim <Icon name="arrow" />
									</Link>
								</div>
							</>
						)}
					</div>
				</Panel>
				<Panel title="Identitas Karya" icon="file" className="home-work">
					<div className="stack compact">
						<div>
							<Badge
								label={
									!team
										? "Bentuk tim terlebih dahulu"
										: ready
											? "Siap untuk ditinjau"
											: work?.title
												? "Masih draf"
												: "Belum diisi"
								}
								tone={ready ? "success" : "warning"}
							/>
						</div>
						<h3>{work?.title || "Ceritakan karya timmu"}</h3>
						<p>
							{work?.description ||
								"Isi judul topik dan deskripsi untuk memberikan gambaran karya kepada mentor."}
						</p>
						{team && (
							<small className="home-materials">
								<Icon name="file" />
								{files} file · {links} link Google Drive
							</small>
						)}
						<div>
							<Link
								className="button secondary"
								href={
									!team
										? "/peserta/tim"
										: !work?.title
											? "/peserta/karya#judul-topik"
											: !work.description
												? "/peserta/karya#deskripsi-topik"
												: "/peserta/karya"
								}
							>
								{!team
									? "Buat / Gabung Tim"
									: ready
										? "Lihat/Edit Identitas Karya"
										: work?.title
											? "Lanjutkan Pengisian"
											: "Lengkapi Identitas Karya"}
							</Link>
						</div>
					</div>
				</Panel>
			</div>
			<section className="home-mentor-section">
				<div className="section-heading">
					<h2>Cari Mentor</h2>
					<Link href="/peserta/mentor" className="text-link">
						Lihat Semua Mentor
					</Link>
				</div>
				<p className="home-section-copy">
					Temukan sudut pandang baru untuk mengembangkan karya timmu.
				</p>
				{preview.length ? (
					<div className="home-mentor-grid">
						{preview.map(
							/** Menampilkan kartu mentor terpusat dengan foto lingkaran serta CTA ke profil. */
							function previewMentor(item) {
								return <MentorCard key={item.id} mentor={item} />;
							},
						)}
					</div>
				) : (
					<Panel>
						<p>Belum ada mentor tersedia. Silakan periksa kembali nanti.</p>
					</Panel>
				)}
			</section>
			<section className="discord-panel">
				<div className="row">
					<Icon name="team" />
					<div>
						<h2>Tetap terhubung dengan komunitas</h2>
						<p>
							Informasi mentoring dan bantuan panitia ada di Discord ADIKARA.
						</p>
					</div>
				</div>
				{settings.discord ? (
					<a
						className="button secondary"
						href={settings.discord}
						target="_blank"
						rel="noreferrer"
					>
						Buka Discord <Icon name="external" />
					</a>
				) : (
					<small>Link Discord akan diumumkan panitia.</small>
				)}
			</section>
			<ResourcePanel links={resources} />
		</div>
	);
}
