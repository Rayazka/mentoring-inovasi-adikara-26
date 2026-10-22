// TODO: Pertahankan kartu Sqq5i dengan filter server dan tanggal ketersediaan aktual.
import Link from "next/link";
import type { loadParticipantCatalog } from "@/controllers/connected/participant-mentor";
import { teamCategories } from "@/models/connected/team";
import { Avatar, EmptyState, Panel } from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";

/** Menampilkan katalog produksi dengan struktur kartu dan filter dari tampilan peserta yang disepakati. */
export function ConnectedMentorCatalog({
	data,
}: {
	data: Awaited<ReturnType<typeof loadParticipantCatalog>>;
}) {
	const { filters } = data;
	/** Mempertahankan filter ketika peserta berpindah halaman hasil. */
	function pageUrl(page: number) {
		return `?${new URLSearchParams({ q: filters.query, expertise: filters.expertise, date: filters.date, page: String(page) })}`;
	}
	return (
		<>
			<Panel className="catalog-filters">
				<form method="get" className="stack">
					<div className="catalog-search-row">
						<label className="field">
							Cari nama mentor
							<input
								name="q"
								type="search"
								defaultValue={filters.query}
								maxLength={100}
								placeholder="Cari nama mentor…"
							/>
						</label>
						<label className="field">
							Tanggal mentoring
							<select name="date" defaultValue={filters.date}>
								<option value="">Semua tanggal</option>
								{data.dates.map(
									/** Menampilkan hari kegiatan dari pengaturan database. */
									function option(date) {
										return (
											<option key={date} value={date}>
												{formatDate(date)}
											</option>
										);
									},
								)}
							</select>
						</label>
						<button
							type="submit"
							className="button secondary"
							name="expertise"
							value={filters.expertise}
						>
							Cari mentor
						</button>
					</div>
					<fieldset className="expertise-filters" aria-label="Bidang keahlian">
						{["", ...teamCategories].map(
							/** Menggabungkan filter bidang dengan isian pencarian dan tanggal yang sedang dipakai. */
							function expertise(value) {
								return (
									<button
										key={value}
										type="submit"
										name="expertise"
										value={value}
										className={`button ${filters.expertise === value ? "" : "secondary"}`}
										aria-pressed={filters.expertise === value}
									>
										{value || "Semua Mentor"}
									</button>
								);
							},
						)}
						<Link className="button neutral" href="/peserta/mentor">
							Hapus filter
						</Link>
					</fieldset>
				</form>
			</Panel>
			{data.error ? (
				<Panel>
					<p role="alert">
						Katalog belum dapat dimuat. Filter tetap tersimpan; coba lagi
						melalui tombol Cari mentor.
					</p>
				</Panel>
			) : (
				<>
					<div className="catalog-result row spread wrap">
						<h2>{data.total} mentor</h2>
						<p>Jadwal aktual mengikuti ketersediaan masing-masing mentor.</p>
					</div>
					{data.mentors.length ? (
						<div className="catalog-grid">
							{data.mentors.map(
								/** Menampilkan profil nyata dengan seluruh elemen kartu rata tengah dan avatar lingkaran. */
								function mentorCard(mentor) {
									return (
										<article className="catalog-card" key={mentor.id}>
											<Avatar
												name={mentor.name}
												photo={mentor.photo_url ?? undefined}
												size="large"
											/>
											<h2>{mentor.name}</h2>
											<div className="tags">
												<span className="tag">{mentor.expertise}</span>
												{mentor.available_dates.length === 1 && (
													<span className="tag">
														Hanya {formatDate(mentor.available_dates[0])}
													</span>
												)}
											</div>
											<p>{mentor.achievements.join(" · ") || mentor.title}</p>
											<Link
												href={`/peserta/mentor/${mentor.id}`}
												className="button secondary"
											>
												Lihat Profil
											</Link>
										</article>
									);
								},
							)}
						</div>
					) : (
						<Panel>
							<EmptyState
								title="Belum ada mentor yang sesuai"
								description="Coba nama, bidang, atau tanggal lain. Profil akan tampil setelah data mentor diaktifkan oleh admin."
								icon="search"
							/>
						</Panel>
					)}
					<nav className="row spread" aria-label="Halaman katalog">
						{filters.page > 1 && (
							<Link href={pageUrl(filters.page - 1)}>Sebelumnya</Link>
						)}
						{filters.page * 24 < data.total && (
							<Link href={pageUrl(filters.page + 1)}>Berikutnya</Link>
						)}
					</nav>
				</>
			)}
		</>
	);
}
