// TODO: Pertahankan struktur C7k5Y dengan statistik seluruh tim dan pagination yang konsisten.
import Link from "next/link";
import type { loadParticipantRequests } from "@/controllers/connected/participant-requests";
import {
	requestStatusLabels,
	participantRequestSchedule,
	type ParticipantRequest,
} from "@/models/connected/request";
import { relationValue, formatWib } from "@/models/connected/operations";
import { Avatar, Badge, EmptyState, Panel } from "@/views/components/ui";

/** Menampilkan satu pengajuan aktual beserta mentor, jadwal, dan tindakan sesuai statusnya. */
export function ParticipantRequestCard({
	request,
}: {
	request: ParticipantRequest;
}) {
	const mentor = relationValue(request.mentor);
	const schedule = participantRequestSchedule(request);
	return (
		<Panel className="participant-request-card">
			<div className="row spread wrap">
				<div>
					<h2>{request.title_snapshot}</h2>
					<p>
						{request.code} · {relationValue(request.team)?.name}
					</p>
				</div>
				<Badge label={requestStatusLabels[request.status]} />
			</div>
			<div className="request-card-columns">
				<div className="stack">
					<small className="detail-label">Mentor sesi</small>
					<div className="row">
						<Avatar
							name={mentor?.name ?? "Mentor"}
							photo={mentor?.photo_url ?? undefined}
						/>
						<div>
							<h3>{mentor?.name ?? "Profil mentor tidak tersedia"}</h3>
							<span className="request-expertise">{mentor?.expertise}</span>
						</div>
					</div>
					<div>
						<small className="detail-label">
							{request.status === "approved"
								? "Jadwal terkonfirmasi"
								: "Jadwal mentoring"}
						</small>
						<strong>
							{schedule
								? formatWib(schedule.starts_at)
								: "Jadwal belum tersedia"}
						</strong>
					</div>
				</div>
				<div className="stack">
					<h3>{requestStatusLabels[request.status]}</h3>
					{request.decision_note && (
						<p style={{ whiteSpace: "pre-wrap" }}>{request.decision_note}</p>
					)}
					{request.status === "pending" && (
						<p>Permintaan sedang ditinjau admin. Slot belum terkonfirmasi.</p>
					)}
					{request.status === "revision_requested" && (
						<Link className="text-link" href="/peserta/karya#informasi-karya">
							Periksa identitas karya
						</Link>
					)}
					{request.status === "approved" && request.meeting_url && (
						<a
							href={request.meeting_url}
							className="button"
							target="_blank"
							rel="noreferrer"
						>
							Masuk pertemuan
						</a>
					)}
					<Link
						className="button secondary"
						href={`/peserta/pengajuan/${request.id}`}
					>
						Lihat detail pengajuan
					</Link>
				</div>
			</div>
		</Panel>
	);
}

/** Menampilkan tab aktif dan riwayat tanpa mencampurkan pengajuan tim lain atau fixtures desain. */
export function ConnectedRequestsPage({
	data,
}: {
	data: Awaited<ReturnType<typeof loadParticipantRequests>>;
}) {
	if (data.kind === "error")
		return (
			<Panel title="Pengajuan belum dapat dimuat">
				<p role="alert">Periksa koneksi dan coba lagi.</p>
				<Link href="/peserta/pengajuan" className="button secondary">
					Coba lagi
				</Link>
			</Panel>
		);
	if (data.kind === "no-team")
		return (
			<Panel>
				<EmptyState
					title="Bentuk tim terlebih dahulu"
					description="Pengajuan mentoring menjadi milik tim aktif."
					icon="team"
				>
					<Link className="button" href="/peserta/tim">
						Ke Tim Saya
					</Link>
				</EmptyState>
			</Panel>
		);
	const { filters, counts } = data;
	/** Mempertahankan pencarian dan status saat berganti halaman hasil. */
	function pageUrl(page: number) {
		return `?${new URLSearchParams({ tab: filters.tab, q: filters.query, status: filters.status, page: String(page) })}`;
	}
	return (
		<>
			<nav className="local-navigation" aria-label="Bagian Pengajuan Mentoring">
				<Link
					href="?tab=active"
					className={filters.tab === "active" ? "is-active" : ""}
				>
					Pengajuan Aktif{" "}
					<span className="count">
						{counts.pending + counts.revision_requested + counts.approved}
					</span>
				</Link>
				<Link
					href="?tab=history"
					className={filters.tab === "history" ? "is-active" : ""}
				>
					Riwayat{" "}
					<span className="count">
						{counts.completed + counts.cancelled + counts.rejected}
					</span>
				</Link>
			</nav>
			<Panel title="Ringkasan status">
				<div className="request-status-summary">
					{(
						["pending", "revision_requested", "approved", "completed"] as const
					).map(
						/** Menampilkan jumlah pasti seluruh pengajuan tim, bukan hanya halaman yang sedang terbuka. */
						function statusSummary(status) {
							return (
								<div key={status}>
									<small>{requestStatusLabels[status]}</small>
									<strong>{counts[status]}</strong>
									<span>Pengajuan tim</span>
								</div>
							);
						},
					)}
				</div>
			</Panel>
			<Panel
				title={
					filters.tab === "active" ? "Pengajuan aktif" : "Riwayat pengajuan"
				}
			>
				<form className="request-history-filters" method="get">
					<input type="hidden" name="tab" value={filters.tab} />
					<label className="field">
						Cari kode pengajuan
						<input
							name="q"
							type="search"
							defaultValue={filters.query}
							maxLength={80}
							placeholder="Contoh: MT-000001"
						/>
					</label>
					<label className="field">
						Status
						<select name="status" defaultValue={filters.status}>
							<option value="">Semua status</option>
							{(filters.tab === "active"
								? (["pending", "revision_requested", "approved"] as const)
								: (["completed", "rejected", "cancelled"] as const)
							).map(
								/** Membatasi pilihan status sesuai tab aktif atau riwayat. */
								function option(status) {
									return (
										<option key={status} value={status}>
											{requestStatusLabels[status]}
										</option>
									);
								},
							)}
						</select>
					</label>
					<button type="submit" className="button secondary">
						Terapkan filter
					</button>
				</form>
			</Panel>
			{data.items.length ? (
				data.items.map(
					/** Menampilkan pengajuan dari hasil server yang sudah dibatasi tim. */
					function request(item) {
						return <ParticipantRequestCard key={item.id} request={item} />;
					},
				)
			) : (
				<Panel>
					<EmptyState
						title={
							filters.query || filters.status
								? "Pengajuan tidak ditemukan"
								: filters.tab === "active"
									? "Belum ada pengajuan aktif"
									: "Belum ada riwayat pengajuan"
						}
						description="Temukan mentor dan waktu diskusi setelah tim serta identitas karya siap."
						icon="request"
					>
						<Link className="button" href="/peserta/mentor">
							Cari Mentor
						</Link>
					</EmptyState>
				</Panel>
			)}
			<nav className="row spread" aria-label="Halaman pengajuan">
				<span>{data.total} pengajuan</span>
				{filters.page > 1 && (
					<Link href={pageUrl(filters.page - 1)}>Sebelumnya</Link>
				)}
				{filters.page * 20 < data.total && (
					<Link href={pageUrl(filters.page + 1)}>Berikutnya</Link>
				)}
			</nav>
		</>
	);
}
