// TODO: Pertahankan daftar terhubung dan kondisi kosong tanpa menggantinya dengan fixtures.
import Link from "next/link";
import { Avatar, Badge, EmptyState, Panel } from "@/views/components/ui";
import type { StaffPageData } from "@/controllers/connected/staff-page";
import {
	requestStatuses,
	formatWib,
	relationValue,
	staffBase,
	type PageFilters,
} from "@/models/connected/operations";
const labels = {
	pending: "Menunggu keputusan",
	revision_requested: "Perlu revisi",
	approved: "Disetujui",
	rejected: "Ditolak",
	cancelled: "Dibatalkan",
	completed: "Selesai",
};
const pageSize = 20;

/** Membuat URL filter pagination tanpa menggabungkan input ke struktur query mentah. */
function pageUrl(page: number, filters: PageFilters) {
	const query = new URLSearchParams();
	query.set("page", String(page));
	if (filters.query) query.set("q", filters.query);
	if (filters.status) query.set("status", filters.status);
	return `?${query}`;
}
/** Menampilkan rentang baris dan navigasi untuk hasil query server. */
function Pagination({
	total,
	filters,
}: {
	total: number;
	filters: PageFilters;
}) {
	return (
		<nav aria-label="Halaman daftar" className="staff-pagination">
			<span>
				{total} data · Halaman {filters.page} dari{" "}
				{Math.max(1, Math.ceil(total / pageSize))}
			</span>
			<div className="row">
				{filters.page > 1 && (
					<Link
						className="button neutral"
						href={pageUrl(filters.page - 1, filters)}
					>
						Sebelumnya
					</Link>
				)}
				{filters.page * pageSize < total && (
					<Link
						className="button secondary"
						href={pageUrl(filters.page + 1, filters)}
					>
						Berikutnya
					</Link>
				)}
			</div>
		</nav>
	);
}
/** Mengirim pencarian dan filter sebagai query GET yang dapat dibagikan. */
function Filters({
	filters,
	status = false,
	placeholder = "Nama",
}: {
	filters: PageFilters;
	status?: boolean;
	placeholder?: string;
}) {
	return (
		<form className="staff-filter" method="get">
			<label className="field">
				Cari {placeholder.toLowerCase()}
				<input
					type="search"
					name="q"
					defaultValue={filters.query}
					placeholder={placeholder}
					maxLength={80}
				/>
			</label>
			{status && (
				<label className="field">
					Status
					<select name="status" defaultValue={filters.status}>
						<option value="">Semua status</option>
						{requestStatuses.map(
							/** Menampilkan hanya status domain yang diterima controller dan database. */
							function option(value) {
								return (
									<option key={value} value={value}>
										{labels[value]}
									</option>
								);
							},
						)}
					</select>
				</label>
			)}
			<button className="button" type="submit">
				Terapkan
			</button>
			<Link className="text-link" href="?">
				Reset
			</Link>
		</form>
	);
}

/** Menyajikan daftar dan detail staf tanpa menyediakan mutasi untuk mentor general. */
export function StaffPage({ data }: { data: StaffPageData }) {
	const base = staffBase(data.role);
	const requestPath = data.role === "admin" ? "operasional" : "pengajuan";
	if (data.kind === "error")
		return (
			<Panel title="Data belum berhasil dimuat">
				<p role="alert" className="notice danger">
					Periksa koneksi dan instalasi database lalu coba lagi.
				</p>
				<a href={base} className="button secondary">
					Kembali ke ringkasan
				</a>
			</Panel>
		);
	if (data.kind === "not-found") return null;
	if (data.kind === "requests")
		return (
			<Panel title="Pengajuan mentoring">
				<div className="stack">
					<p className="muted">
						Seluruh pengajuan yang dapat diakses akun ini. Slot baru dipesan
						setelah disetujui admin.
					</p>
					<Filters filters={data.filters} status placeholder="Kode pengajuan" />
					{data.items.length ? (
						<div className="staff-table-wrap">
							<table>
								<thead>
									<tr>
										<th>Pengajuan / karya</th>
										<th>Tim</th>
										<th>Mentor / jadwal</th>
										<th>Status</th>
										<th>Detail</th>
									</tr>
								</thead>
								<tbody>
									{data.items.map(
										/** Menyajikan pengajuan hasil filter server dengan tautan detail terotorisasi. */
										function requestRow(item) {
											return (
												<tr key={item.id}>
													<td>
														<strong>{item.code}</strong>
														<small>{item.title_snapshot}</small>
													</td>
													<td>{relationValue(item.team)?.name ?? "Tim"}</td>
													<td>
														{relationValue(item.mentor)?.name ?? "Mentor"}
														<small>
															{relationValue(item.slot)?.starts_at
																? formatWib(
																		relationValue(item.slot)?.starts_at ?? "",
																	)
																: "Belum tersedia"}
														</small>
													</td>
													<td>
														<Badge status={item.status} />
													</td>
													<td>
														<Link
															className="text-link"
															href={`${base}/${requestPath}/${item.id}`}
														>
															Lihat detail
														</Link>
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
							title="Belum ada pengajuan yang sesuai"
							description="Coba ubah filter atau tunggu peserta mengirim pengajuan."
							icon="request"
						/>
					)}
					<Pagination total={data.total} filters={data.filters} />
				</div>
			</Panel>
		);
	if (data.kind === "request") {
		const item = data.item;
		return (
			<>
				<Link className="text-link" href={`${base}/${requestPath}`}>
					← Kembali ke pengajuan
				</Link>
				<div className="staff-dashboard-grid">
					<Panel
						title={`${item.code} · ${relationValue(item.team)?.name ?? "Tim"}`}
						actions={<Badge status={item.status} />}
					>
						<div className="stack">
							<div>
								<span className="eyebrow">IDENTITAS KARYA SAAT DIAJUKAN</span>
								<h2>{item.title_snapshot}</h2>
							</div>
							<p className="staff-copy">{item.description_snapshot}</p>
							<div className="subtle-box">
								<strong>{relationValue(item.mentor)?.name ?? "Mentor"}</strong>
								<p>
									{relationValue(item.slot)?.starts_at
										? formatWib(relationValue(item.slot)?.starts_at ?? "")
										: "Jadwal belum tersedia"}
								</p>
							</div>
							{item.meeting_url && (
								<a
									className="button secondary"
									href={item.meeting_url}
									target="_blank"
									rel="noreferrer"
								>
									Buka tautan pertemuan
								</a>
							)}
							{item.decision_note && (
								<div className="notice">
									<strong>Catatan keputusan</strong>
									<p className="staff-copy">{item.decision_note}</p>
								</div>
							)}
						</div>
					</Panel>
					<Panel title="Dokumen tim">
						{data.documents.length ? (
							<div className="stack">
								{data.documents.map(
									/** Menampilkan metadata dokumen yang dibatasi RLS dan tautan Drive yang diisi tim. */
									function document(item) {
										return (
											<div className="subtle-box" key={item.id}>
												<strong>{item.title}</strong>
												<p className="muted">
													{item.filename ?? "Google Drive"}
												</p>
												{item.inaccessible ? (
													<p className="notice warning">
														Dokumen ditandai belum dapat diakses.
													</p>
												) : !item.ready ? (
													<p className="muted">Unggahan belum selesai.</p>
												) : item.kind === "drive" && item.drive_url ? (
													<a
														className="text-link"
														href={item.drive_url}
														target="_blank"
														rel="noreferrer"
													>
														Buka Google Drive
													</a>
												) : (
													<a
														className="text-link"
														href={`/api/documents/${item.id}/download`}
													>
														Unduh file
													</a>
												)}
											</div>
										);
									},
								)}
							</div>
						) : (
							<EmptyState
								title="Belum ada dokumen"
								description="Dokumen tim akan muncul setelah peserta mengunggahnya."
							/>
						)}
					</Panel>
				</div>
			</>
		);
	}
	if (data.kind === "mentors")
		return (
			<div className="stack">
				<Panel title="Daftar mentor">
					<Filters filters={data.filters} />
				</Panel>
				{data.items.length ? (
					<div className="staff-mentor-grid">
						{data.items.map(
							/** Menampilkan profil mentor database dengan foto bulat dan seluruh elemen rata tengah. */
							function mentor(item) {
								return (
									<Panel key={item.id}>
										<div className="staff-mentor-card">
											<Avatar
												name={item.name}
												photo={item.photo_url ?? undefined}
												size="large"
											/>
											<Badge label={item.expertise} />
											<h2>{item.name}</h2>
											<p>{item.title || "Mentor ADIKARA 2026"}</p>
											<p className="muted staff-copy">{item.bio}</p>
											<Badge
												label={
													item.archived
														? "Diarsipkan"
														: item.active
															? "Aktif"
															: "Nonaktif"
												}
												tone={item.active && !item.archived ? "success" : ""}
											/>
											<Link className="text-link" href={`${base}/jadwal`}>
												Lihat jadwal mentoring
											</Link>
										</div>
									</Panel>
								);
							},
						)}
					</div>
				) : (
					<Panel>
						<EmptyState
							title="Belum ada mentor"
							description="Profil mentor yang ditambahkan admin akan tampil di sini."
							icon="mentor"
						/>
					</Panel>
				)}
				<Pagination total={data.total} filters={data.filters} />
			</div>
		);
	if (data.kind === "schedules")
		return (
			<Panel title="Jadwal seluruh mentor">
				<div className="stack">
					<p className="notice">
						Semua jam ditampilkan dalam WIB. Slot aktif belum tentu terbooking;
						sesi terkonfirmasi dapat dilihat pada pengajuan berstatus disetujui.
					</p>
					{data.items.length ? (
						<div className="staff-table-wrap">
							<table>
								<thead>
									<tr>
										<th>Mentor</th>
										<th>Mulai</th>
										<th>Selesai</th>
										<th>Jeda sampai</th>
										<th>Slot</th>
									</tr>
								</thead>
								<tbody>
									{data.items.map(
										/** Menampilkan interval sesi dan buffer sebagai data terpisah. */
										function slot(item) {
											return (
												<tr key={item.id}>
													<td>
														{relationValue(item.mentor)?.name ?? "Mentor"}
													</td>
													<td>{formatWib(item.starts_at)}</td>
													<td>{formatWib(item.ends_at)}</td>
													<td>{formatWib(item.buffer_ends_at)}</td>
													<td>
														<Badge
															label={item.enabled ? "Aktif" : "Dinonaktifkan"}
															tone={item.enabled ? "success" : ""}
														/>
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
							title="Jadwal belum tersedia"
							description="Slot akan tampil setelah admin menambahkan jadwal mentor."
							icon="calendar"
						/>
					)}
					<Pagination total={data.total} filters={data.filters} />
				</div>
			</Panel>
		);
	if (data.kind === "teams")
		return (
			<Panel title="Tim & Identitas Karya">
				<div className="stack">
					<Filters filters={data.filters} placeholder="Nama tim" />
					{data.items.length ? (
						data.items.map(
							/** Menyajikan judul dan deskripsi karya terkini pada tim yang dapat diakses staf. */
							function team(item) {
								const work = relationValue(item.work);
								return (
									<div className="subtle-box stack" key={item.id}>
										<div className="row spread">
											<h2>{item.name}</h2>
											<Badge label={item.category} />
										</div>
										<p>{item.description}</p>
										{work ? (
											<>
												<h3>{work.title || "Judul belum diisi"}</h3>
												<p className="staff-copy">
													{work.description || "Deskripsi belum diisi"}
												</p>
												<Badge
													label={
														work.is_draft ? "Draf" : "Identitas karya lengkap"
													}
													tone={work.is_draft ? "warning" : "success"}
												/>
											</>
										) : (
											<p className="notice">
												Tim belum mengisi Identitas Karya.
											</p>
										)}
									</div>
								);
							},
						)
					) : (
						<EmptyState
							title="Belum ada tim yang sesuai"
							description="Tim peserta dan identitas karya akan tampil setelah dibuat."
							icon="team"
						/>
					)}
					<Pagination total={data.total} filters={data.filters} />
				</div>
			</Panel>
		);
	return (
		<Panel title="Riwayat aktivitas">
			<div className="stack">
				{data.items.length ? (
					data.items.map(
						/** Menampilkan metadata audit tanpa memublikasikan payload internal. */
						function audit(item) {
							return (
								<div className="staff-list-row" key={item.id}>
									<div>
										<strong>{item.action}</strong>
										<small>
											{item.entity} · {item.entity_id}
										</small>
									</div>
									<small>{formatWib(item.created_at)}</small>
								</div>
							);
						},
					)
				) : (
					<EmptyState
						title="Belum ada aktivitas"
						description="Aktivitas perubahan oleh admin akan tercatat di sini."
					/>
				)}
				<Pagination total={data.total} filters={data.filters} />
			</div>
		</Panel>
	);
}
