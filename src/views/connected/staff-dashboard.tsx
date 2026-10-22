// TODO: Cocokkan perubahan susunan dashboard dengan RyujH dan SLLdc tanpa memakai angka fixtures.
import Link from "next/link";
import { Badge, EmptyState, Icon, Panel } from "@/views/components/ui";
import type { loadStaffDashboard } from "@/controllers/connected/staff-dashboard";
import {
	formatWib,
	relationValue,
	staffBase,
	totalRequests,
} from "@/models/connected/operations";

/** Menampilkan ringkasan staf, metrik nyata, jadwal dan prioritas operasional. */
export function StaffDashboard({
	data,
}: {
	data: Awaited<ReturnType<typeof loadStaffDashboard>>;
}) {
	const { role, name, summary, error } = data;
	const admin = role === "admin";
	const base = staffBase(role);
	const requestPath = admin ? "operasional" : "pengajuan";
	if (!summary)
		return (
			<Panel title="Ringkasan belum tersedia">
				<p role="alert" className="notice danger">
					{error}
				</p>
				<a className="button secondary" href={base}>
					Coba lagi
				</a>
			</Panel>
		);
	const metrics = admin
		? [
				{
					label: "Tim terdaftar",
					value: summary.teams,
					icon: "team" as const,
					href: `${base}/tim`,
				},
				{
					label: "Mentor aktif",
					value: summary.mentors,
					icon: "mentor" as const,
					href: `${base}/mentor`,
				},
				{
					label: "Menunggu keputusan",
					value: summary.statuses.pending,
					icon: "clock" as const,
					href: `${base}/${requestPath}?status=pending`,
				},
				{
					label: "Sesi disetujui",
					value: summary.statuses.approved,
					icon: "check" as const,
					href: `${base}/${requestPath}?status=approved`,
				},
			]
		: [
				{
					label: "Seluruh pengajuan",
					value: totalRequests(summary),
					icon: "request" as const,
					href: `${base}/${requestPath}`,
				},
				{
					label: "Menunggu keputusan",
					value: summary.statuses.pending,
					icon: "clock" as const,
					href: `${base}/${requestPath}?status=pending`,
				},
				{
					label: "Sesi disetujui",
					value: summary.statuses.approved,
					icon: "check" as const,
					href: `${base}/${requestPath}?status=approved`,
				},
				{
					label: "Sesi selesai",
					value: summary.statuses.completed,
					icon: "calendar" as const,
					href: `${base}/${requestPath}?status=completed`,
				},
			];
	return (
		<>
			<div className="staff-greeting">
				<div>
					<span className="eyebrow">ADIKARA 2026 · RUANG MENTORING</span>
					<h2>Halo, {name}.</h2>
					<p>
						{admin
							? "Pantau kesiapan dan aktivitas seluruh mentoring dari satu tempat."
							: "Lihat jadwal, pengajuan, dan identitas karya seluruh tim."}
					</p>
				</div>
			</div>
			<p className="staff-data-context">
				Data Supabase · Hitungan seluruh periode · Diperbarui{" "}
				{formatWib(summary.updatedAt)}
			</p>
			<div className="staff-metrics">
				{metrics.map(
					/** Menghubungkan metrik ke daftar sumber yang dapat ditelusuri. */
					function metric(card) {
						return (
							<Link href={card.href} className="staff-metric" key={card.label}>
								<span className="staff-metric-icon">
									<Icon name={card.icon} />
								</span>
								<span>{card.label}</span>
								<strong>{card.value}</strong>
								<small>
									Lihat rincian <Icon name="arrow" />
								</small>
							</Link>
						);
					},
				)}
			</div>
			<div className="staff-dashboard-grid">
				<Panel
					title={admin ? "Prioritas operasional" : "Jadwal mentoring terdekat"}
					icon={admin ? "bell" : "calendar"}
				>
					{admin ? (
						<div className="stack">
							<div className="notice warning">
								<strong>
									{summary.statuses.pending} pengajuan menunggu keputusan
								</strong>
								<p>Pengajuan belum memesan slot sampai disetujui admin.</p>
								<Link
									className="text-link"
									href={`${base}/operasional?status=pending`}
								>
									Tinjau pengajuan <Icon name="arrow" />
								</Link>
							</div>
							<div className="subtle-box">
								<strong>
									{summary.statuses.revision_requested} pengajuan sedang
									direvisi
								</strong>
								<p>Pantau tim yang perlu memperbarui karya atau jadwal.</p>
								<Link
									className="text-link"
									href={`${base}/operasional?status=revision_requested`}
								>
									Lihat revisi <Icon name="arrow" />
								</Link>
							</div>
							{summary.mentors === 0 && (
								<p className="notice">
									Belum ada profil mentor di database. Data mentor perlu
									ditambahkan sebelum peserta dapat memilih jadwal.
								</p>
							)}
						</div>
					) : summary.upcoming.length ? (
						<div className="stack">
							{summary.upcoming.map(
								/** Menampilkan jadwal booking terkonfirmasi, bukan slot pengajuan yang masih pending. */
								function booking(item) {
									return (
										<Link
											className="staff-list-row"
											key={item.request_id}
											href={`${base}/${requestPath}/${item.request_id}`}
										>
											<span>
												<strong>
													{relationValue(item.team)?.name ?? "Tim"}
												</strong>
												<small>
													{relationValue(item.mentor)?.name ?? "Mentor"} ·{" "}
													{relationValue(item.request)?.code}
												</small>
											</span>
											<span>{formatWib(item.starts_at)}</span>
										</Link>
									);
								},
							)}
						</div>
					) : (
						<EmptyState
							title="Belum ada sesi terdekat"
							description="Sesi yang disetujui dan belum dimulai akan tampil di sini."
							icon="calendar"
						/>
					)}
				</Panel>
				<Panel title="Informasi mentoring" icon="calendar">
					<div className="stack">
						<div>
							<small className="muted">Tanggal acara</small>
							{summary.settings.dates.map(
								/** Menampilkan tanggal acara sesuai pengaturan admin. */
								function eventDate(date) {
									return (
										<p key={date}>
											<strong>
												{formatWib(`${date}T12:00:00+07:00`, false)}
											</strong>
										</p>
									);
								},
							)}
						</div>
						<div>
							<small className="muted">Jam operasional</small>
							<p>
								<strong>
									{summary.settings.day_start.slice(0, 5)}–
									{summary.settings.day_end.slice(0, 5)} WIB
								</strong>
							</p>
						</div>
						<p>
							{summary.settings.session_minutes} menit sesi +{" "}
							{summary.settings.buffer_minutes} menit jeda
						</p>
						<a
							className="button secondary"
							href={summary.settings.discord_url}
							target="_blank"
							rel="noreferrer"
						>
							Buka Discord <Icon name="external" />
						</a>
					</div>
				</Panel>
			</div>
			<div className="staff-shortcuts">
				<Link className="button secondary" href={`${base}/mentor`}>
					Daftar mentor
				</Link>
				<Link className="button secondary" href={`${base}/jadwal`}>
					Lihat jadwal
				</Link>
				<Link className="button secondary" href={`${base}/${requestPath}`}>
					Pantau pengajuan
				</Link>
				<Link className="button secondary" href={`${base}/tim`}>
					Tim &amp; Identitas Karya
				</Link>
			</div>
			<div className="staff-dashboard-grid">
				<Panel
					title="Pengajuan terbaru"
					icon="request"
					actions={
						<Link className="text-link" href={`${base}/${requestPath}`}>
							Lihat semua
						</Link>
					}
				>
					{summary.requests.length ? (
						<div className="stack">
							{summary.requests.map(
								/** Menghubungkan ringkasan pengajuan pada detail yang dijaga guard server dan RLS. */
								function requestRow(item) {
									return (
										<Link
											className="staff-list-row"
											key={item.id}
											href={`${base}/${requestPath}/${item.id}`}
										>
											<div>
												<strong>
													{item.code} ·{" "}
													{relationValue(item.team)?.name ?? "Tim"}
												</strong>
												<small>{item.title_snapshot}</small>
												<small>
													{relationValue(item.mentor)?.name ?? "Mentor"} ·{" "}
													{formatWib(item.created_at)}
												</small>
											</div>
											<Badge status={item.status} />
										</Link>
									);
								},
							)}
						</div>
					) : (
						<EmptyState
							title="Belum ada pengajuan"
							description="Pengajuan dari peserta akan muncul di sini setelah dikirim."
							icon="request"
						/>
					)}
				</Panel>
				<Panel
					title={admin ? "Sorotan operasional" : "Kesiapan mentoring"}
					icon="file"
				>
					<div className="stack">
						<div className="staff-summary-line">
							<span>Slot aktif mendatang</span>
							<strong>{summary.slots}</strong>
						</div>
						<div className="staff-summary-line">
							<span>Dokumen siap diakses</span>
							<strong>{summary.documents}</strong>
						</div>
						<div className="staff-summary-line">
							<span>Pengajuan ditolak</span>
							<strong>{summary.statuses.rejected}</strong>
						</div>
						<div className="staff-summary-line">
							<span>Pengajuan dibatalkan</span>
							<strong>{summary.statuses.cancelled}</strong>
						</div>
						<p className="muted">
							{admin
								? "Perubahan operasional dicatat dalam riwayat aktivitas."
								: "Akun mentor general dapat melihat data seluruh mentor dan tim. Keputusan serta perubahan jadwal dilakukan admin."}
						</p>
					</div>
				</Panel>
			</div>
			{admin && (
				<Panel
					title="Aktivitas terakhir"
					icon="file"
					actions={
						<Link className="text-link" href="/admin/audit">
							Lihat semua
						</Link>
					}
				>
					{summary.audit.length ? (
						<div className="stack">
							{summary.audit.map(
								/** Menampilkan metadata audit terbaru tanpa mengirim detail JSON internal ke browser. */
								function auditRow(item) {
									return (
										<div key={item.id} className="staff-list-row">
											<div>
												<strong>{item.action}</strong>
												<small>{item.entity}</small>
											</div>
											<small>{formatWib(item.created_at)}</small>
										</div>
									);
								},
							)}
						</div>
					) : (
						<EmptyState
							title="Belum ada aktivitas tercatat"
							description="Aktivitas operasional admin akan tampil setelah ada perubahan."
						/>
					)}
				</Panel>
			)}
		</>
	);
}
