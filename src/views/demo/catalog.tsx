// TODO: Hubungkan filter katalog ke query server dengan proyeksi profil publik pada produksi.
"use client";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { Mentor } from "@/models/demo/types";
import { mentorDetailData } from "@/controllers/demo/mentor-detail-controller";

import {
	Avatar,
	Badge,
	Icon,
	EmptyState,
	Button,
	Panel,
} from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";
import { registerDemoView } from "./registry";

/** Menyajikan katalog atau profil mentor sesuai route tanpa menghalangi peserta yang belum punya tim. */
export function MentorCatalog({
	controller,
	pathname,
}: {
	controller: DemoController;
	pathname: string;
}) {
	const { state } = controller;
	const [search, setSearch] = useState("");
	const [expertise, setExpertise] = useState("");
	const [date, setDate] = useState("");
	/** Mengembalikan seluruh filter katalog ke keadaan awal. */
	function resetFilters() {
		setSearch("");
		setExpertise("");
		setDate("");
	}
	/** Menyaring katalog berdasarkan nama mentor. */
	function changeSearch(event: ChangeEvent<HTMLInputElement>) {
		setSearch(event.target.value);
	}
	/** Mengubah hari mentoring yang dipakai untuk menyaring profil tersedia. */
	function changeDate(event: ChangeEvent<HTMLSelectElement>) {
		setDate(event.target.value);
	}
	if (!state) return null;
	const mentorId = pathname.split("/")[3];
	if (mentorId) {
		const mentor = state.mentors.find(
			/** Memilih profil aktif agar URL langsung tidak membuka mentor yang telah diarsipkan. */
			function activeProfile(item) {
				return item.id === mentorId && item.active && !item.archived;
			},
		);
		return mentor ? (
			<MentorDetail key={mentor.id} controller={controller} mentor={mentor} />
		) : (
			<Panel>
				<EmptyState
					title="Mentor tidak tersedia"
					description="Profil mungkin dinonaktifkan atau diarsipkan. Pilih mentor lain dari katalog."
					icon="mentor"
				>
					<Link className="button" href="/peserta/mentor">
						Kembali ke katalog
					</Link>
				</EmptyState>
			</Panel>
		);
	}
	const mentors = state.mentors.filter(
		/** Menggabungkan pencarian dengan bidang dan tanggal yang memang dimiliki mentor. */
		function matchingMentor(mentor) {
			return (
				mentor.active &&
				!mentor.archived &&
				mentor.name.toLowerCase().includes(search.toLowerCase()) &&
				(!expertise || mentor.expertise === expertise) &&
				(!date || mentor.dates.includes(date))
			);
		},
	);
	return (
		<>
			<Panel className="catalog-filters">
				<div className="catalog-search-row">
					<label className="field">
						Cari nama mentor
						<input
							type="search"
							value={search}
							onChange={changeSearch}
							placeholder="Cari nama mentor…"
						/>
					</label>
					<label className="field">
						Tanggal mentoring
						<select value={date} onChange={changeDate}>
							<option value="">Semua tanggal</option>
							{state.settings.dates.map(
								/** Menampilkan tanggal kegiatan untuk filter katalog. */
								function dateOption(day) {
									return (
										<option key={day} value={day}>
											{formatDate(day)}
										</option>
									);
								},
							)}
						</select>
					</label>
					<Button variant="secondary" onClick={resetFilters}>
						Hapus Filter
					</Button>
				</div>
				<fieldset className="expertise-filters" aria-label="Bidang keahlian">
					{["", "UI/UX", "Softdev", "IoT", "Gamedev"].map(
						/** Menampilkan filter bidang berbentuk tombol dengan penanda aktif. */
						function expertiseFilter(field) {
							/** Menerapkan bidang yang dipilih sambil mempertahankan pencarian dan tanggal. */
							function selectExpertise() {
								setExpertise(field);
							}
							return (
								<button
									type="button"
									key={field}
									className={`button ${expertise === field ? "" : "secondary"}`}
									aria-pressed={expertise === field}
									onClick={selectExpertise}
								>
									{field || "Semua Mentor"}
								</button>
							);
						},
					)}
				</fieldset>
			</Panel>
			<div className="catalog-result row spread wrap">
				<h2>{mentors.length} mentor</h2>
				<p>Jadwal aktual mengikuti ketersediaan masing-masing mentor.</p>
			</div>
			{mentors.length ? (
				<div className="catalog-grid">
					{mentors.map(
						/** Menampilkan kartu mentor rata tengah dengan foto atau avatar lingkaran. */
						function mentorCard(mentor) {
							return (
								<article className="catalog-card" key={mentor.id}>
									<Avatar
										name={mentor.name}
										size="large"
										photo={mentor.photo}
									/>
									<h2>{mentor.name}</h2>
									<div className="tags">
										<span className="tag">{mentor.expertise}</span>
										{mentor.dates.length === 1 && (
											<span className="tag">Hanya 24 Oktober</span>
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
						description="Coba nama, bidang atau tanggal lain. Filtermu tetap tersimpan di halaman ini."
						icon="search"
					/>
				</Panel>
			)}
		</>
	);
}

/** Menampilkan profil dan slot nyata dari data demo dengan prasyarat pengajuan milik ketua tim. */
function MentorDetail({
	controller,
	mentor,
}: {
	controller: DemoController;
	mentor: Mentor;
}) {
	const { state, actor } = controller;
	const [date, setDate] = useState(mentor.dates[0]);
	const [slotId, setSlotId] = useState("");

	if (!state || !actor) return null;
	const { team, ready, restriction, slots, selected } = mentorDetailData(
		state,
		actor,
		mentor,
		date,
		slotId,
	);
	return (
		<>
			<Panel className="mentor-profile-reference">
				<div className="mentor-profile-identity">
					<Avatar name={mentor.name} photo={mentor.photo} size="large" />
					<div>
						<h2>{mentor.name}</h2>
						<p>{mentor.title} · Aktif</p>
						<p className="mentor-bio">{mentor.bio}</p>
						<div className="row">
							<Badge label={mentor.expertise} />
							<span className="mentor-active">● Status aktif</span>
						</div>
					</div>
				</div>
				<div className="mentor-profile-information">
					<section>
						<h3>Prestasi</h3>
						<ul>
							{mentor.achievements.map(
								/** Menampilkan prestasi dari profil tanpa mengambil fixture desain privat. */
								function achievement(text, index) {
									return (
										<li key={`${index}-${text}`}>
											<Icon name="mentor" />
											{text}
										</li>
									);
								},
							)}
						</ul>
					</section>
					<section>
						<h3>Ketersediaan</h3>
						<p>
							{mentor.dates
								.map(
									/** Merangkum hari yang memang diaktifkan pada profil mentor. */
									function availableDate(day) {
										return formatDate(day);
									},
								)
								.join(" dan ")}
						</p>
						<p>
							Jam operasional {state.settings.start}–{state.settings.end} WIB
						</p>
						<p>Slot aktual ditampilkan di bawah.</p>
					</section>
				</div>
			</Panel>
			<Panel
				title="Pilih jadwal mentoring"
				className="mentor-schedule-reference"
				actions={
					<Badge
						label={
							slots.some(
								/** Menentukan apakah hari terpilih masih mempunyai slot tersedia. */
								function availableSlot(slot) {
									return !slot.disabled;
								},
							)
								? "Slot tersedia"
								: "Tidak ada slot tersedia"
						}
						tone="success"
					/>
				}
			>
				<div className="stack">
					<div className="expertise-filters">
						{state.settings.dates.map(
							/** Menampilkan pilihan hari sekaligus menjelaskan hari yang tidak dilayani mentor. */
							function dayButton(day) {
								/** Mengganti hari dan menghapus pilihan dari tanggal sebelumnya. */
								function selectDay() {
									setDate(day);
									setSlotId("");
								}
								return (
									<button
										key={day}
										type="button"
										className={`button ${date === day ? "" : "secondary"}`}
										aria-pressed={date === day}
										disabled={!mentor.dates.includes(day)}
										onClick={selectDay}
									>
										{formatDate(day)}
										{!mentor.dates.includes(day) ? " · Tidak tersedia" : ""}
									</button>
								);
							},
						)}
					</div>
					<p>
						Waktu sesi dalam WIB · {state.settings.sessionMinutes} menit + jeda{" "}
						{state.settings.bufferMinutes} menit
					</p>
					{slots.length ? (
						<div className="mentor-slot-grid">
							{slots.map(
								/** Menampilkan keadaan slot dengan label agar tidak bergantung pada warna. */
								function slotButton(slot) {
									/** Menyimpan pilihan sementara yang belum mengunci jadwal. */
									function selectSlot() {
										setSlotId(slot.id);
									}
									return (
										<button
											key={slot.id}
											type="button"
											disabled={slot.disabled}
											aria-pressed={slot.id === selected?.id}
											className={`mentor-slot ${slot.id === selected?.id ? "is-selected" : ""}`}
											onClick={selectSlot}
										>
											<strong>{slot.start.replace(":", ".")}</strong>
											<small>
												{slot.id === selected?.id ? "Dipilih" : slot.label}
											</small>
										</button>
									);
								},
							)}
						</div>
					) : (
						<EmptyState
							title="Belum ada slot pada hari ini"
							description="Coba tanggal lain atau pilih mentor lain."
							icon="calendar"
						/>
					)}
					<p className="notice">
						Slot dipilih belum menjadi pemesanan. Jadwal dikonfirmasi setelah
						mentor menyetujui.
					</p>
					<div className="mentor-selection">
						<div>
							<small>Slot terpilih</small>
							<strong>
								{selected
									? `${formatDate(date)} · ${selected.start}–${selected.end} WIB`
									: "Belum ada slot dipilih"}
							</strong>
						</div>
						<div>
							<small>Mentor</small>
							<strong>{mentor.name}</strong>
						</div>
						<div>
							<small>Identitas Karya</small>
							<Link href="/peserta/karya">Lihat karya tim</Link>
						</div>
					</div>
					<div className="actions">
						{selected && !restriction ? (
							<Link
								className="button"
								href={`/peserta/pengajuan/baru?mentor=${encodeURIComponent(mentor.id)}&slot=${encodeURIComponent(selected.id)}`}
							>
								Lanjut ke Pengajuan
							</Link>
						) : (
							<Button disabled>Lanjut ke Pengajuan</Button>
						)}
						<Link href="/peserta/pengajuan" className="button neutral">
							Lihat pengajuan aktif
						</Link>
					</div>
					{restriction ? (
						<p className="helper">
							{restriction}{" "}
							{!team ? (
								<Link href="/peserta/tim" className="text-link">
									Ke Tim Saya
								</Link>
							) : !ready ? (
								<Link href="/peserta/karya#judul-topik" className="text-link">
									Isi Identitas Karya
								</Link>
							) : null}
						</p>
					) : !selected ? (
						<p className="helper">
							Pilih slot tersedia untuk melanjutkan pengajuan.
						</p>
					) : null}
				</div>
			</Panel>
		</>
	);
}
registerDemoView("/peserta/mentor", MentorCatalog);
