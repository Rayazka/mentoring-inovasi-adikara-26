// TODO: Hubungkan filter katalog ke query server dengan proyeksi profil publik pada produksi.
"use client";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { Mentor } from "@/models/demo/types";
import { teamForUser, workIsReady } from "@/models/demo/selectors";
import { slotIsBooked } from "@/models/demo/slot-policy";
import {
	Avatar,
	EmptyState,
	Button,
	Panel,
	formatDate,
} from "@/views/components/ui";
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
	/** Mengganti tanggal dan menghapus pilihan slot dari hari sebelumnya. */
	function changeDate(event: ChangeEvent<HTMLSelectElement>) {
		setDate(event.target.value);
		setSlotId("");
	}
	if (!state || !actor) return null;
	const team = teamForUser(state, actor.id);
	const ready = team && workIsReady(state, team.id);
	const leader = team?.leaderId === actor.id;
	const slots = state.slots
		.filter(
			/** Memilih slot hari mentor yang sedang dilihat peserta. */
			function displayedSlot(slot) {
				return slot.mentorId === mentor.id && slot.date === date;
			},
		)
		.sort(
			/** Menata jam secara menaik untuk pemilihan yang mudah dipindai. */
			function chronological(a, b) {
				return a.start.localeCompare(b.start);
			},
		);
	const selected = slots.find(
		/** Memeriksa ulang pilihan jika jadwal berubah melalui tab lain. */
		function selectedSlot(slot) {
			return (
				slot.id === slotId &&
				slot.enabled &&
				!slotIsBooked(state, slot.id) &&
				new Date(`${slot.date}T${slot.start}:00+07:00`).getTime() > Date.now()
			);
		},
	);
	return (
		<>
			<Link className="text-link" href="/peserta/mentor">
				← Kembali ke katalog
			</Link>
			<div className="section-heading">
				<div>
					<span className="eyebrow">KENALI MENTORMU</span>
					<h1>Profil Mentor</h1>
				</div>
			</div>
			<div className="grid-2">
				<div className="stack">
					<article className="mentor-card">
						<Avatar name={mentor.name} photo={mentor.photo} size="large" />
						<h2>{mentor.name}</h2>
						<p>{mentor.title}</p>
						<span className="tag">{mentor.expertise}</span>
					</article>
					<Panel title="Tentang mentor">
						<p>{mentor.bio}</p>
					</Panel>
					<Panel title="Pengalaman & pencapaian">
						<ul>
							{mentor.achievements.map(
								/** Menampilkan pencapaian fiktif tanpa membaca data mentor privat. */
								function achievement(value, index) {
									return <li key={`${index}-${value}`}>{value}</li>;
								},
							)}
						</ul>
					</Panel>
				</div>
				<Panel title="Pilih jadwal mentoring" icon="calendar">
					<div className="stack">
						<label className="field">
							Tanggal
							<select value={date} onChange={changeDate}>
								{mentor.dates.map(
									/** Memastikan hari yang tidak tersedia tidak dapat dipilih melalui UI. */
									function availableDay(day) {
										return (
											<option key={day} value={day}>
												{formatDate(day)}
											</option>
										);
									},
								)}
							</select>
						</label>
						<p className="helper">
							Semua waktu WIB · sesi {state.settings.sessionMinutes} menit +
							jeda {state.settings.bufferMinutes} menit. Pengajuan yang menunggu
							belum mengunci slot.
						</p>
						{slots.length ? (
							<div className="slots">
								{slots.map(
									/** Menampilkan slot tersedia, terbooking, dinonaktifkan atau lewat dengan label teks. */
									function slotChoice(slot) {
										const booked = slotIsBooked(state, slot.id);
										const past =
											new Date(`${date}T${slot.start}:00+07:00`).getTime() <=
											Date.now();
										const disabled = booked || past || !slot.enabled;
										/** Menyimpan pilihan jadwal lokal sebelum peserta meninjau pengajuan. */
										function selectSlot() {
											setSlotId(slot.id);
										}
										return (
											<button
												key={slot.id}
												type="button"
												className={`slot ${slot.id === selected?.id ? "selected" : ""} ${disabled ? "booked" : ""}`}
												disabled={disabled}
												aria-pressed={slot.id === selected?.id}
												onClick={selectSlot}
											>
												<strong>
													{slot.start}–{slot.end}
												</strong>
												<small>
													{booked
														? "Terbooking"
														: past
															? "Sudah lewat"
															: !slot.enabled
																? "Nonaktif"
																: slot.id === selected?.id
																	? "Dipilih"
																	: "Tersedia"}
												</small>
											</button>
										);
									},
								)}
							</div>
						) : (
							<EmptyState
								title="Belum ada slot pada hari ini"
								description="Coba hari lain atau pilih mentor lain."
								icon="calendar"
							/>
						)}
						{!team ? (
							<div className="notice warning">
								<p>
									Buat atau bergabung dengan tim untuk mengajukan mentoring.
								</p>
								<Link className="button secondary" href="/peserta/tim">
									Ke Tim Saya
								</Link>
							</div>
						) : !ready ? (
							<div className="notice warning">
								<p>
									Lengkapi judul dan deskripsi topik karya tim terlebih dahulu.
								</p>
								<Link
									className="button secondary"
									href="/peserta/karya#judul-topik"
								>
									Isi Identitas Karya
								</Link>
							</div>
						) : !leader ? (
							<p className="notice">
								Kamu dapat menjelajahi jadwal. Pengajuan dikirim oleh ketua tim.
							</p>
						) : selected ? (
							<Link
								className="button"
								href={`/peserta/pengajuan/baru?mentor=${encodeURIComponent(mentor.id)}&slot=${encodeURIComponent(selected.id)}`}
							>
								Tinjau pengajuan
							</Link>
						) : (
							<p className="notice">
								Pilih slot tersedia untuk melanjutkan pengajuan.
							</p>
						)}
					</div>
				</Panel>
			</div>
		</>
	);
}
registerDemoView("/peserta/mentor", MentorCatalog);
