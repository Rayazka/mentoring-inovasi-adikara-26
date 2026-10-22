// TODO: Pertahankan struktur profil kw3pR dan validasi ulang slot pada langkah pengajuan.
"use client";
import Link from "next/link";
import { useState } from "react";
import {
	slotAvailability,
	type MentorDetailData,
} from "@/models/connected/mentor";
import { formatWib } from "@/models/connected/operations";
import {
	Avatar,
	Badge,
	EmptyState,
	Panel,
	formatDate,
} from "@/views/components/ui";

/** Menampilkan profil dan pemilihan slot aktual tanpa menganggap pilihan sementara sebagai booking. */
export function ConnectedMentorDetail({
	data,
	now,
}: {
	data: MentorDetailData;
	now: number;
}) {
	const [slotId, setSlotId] = useState("");
	if (data.error)
		return (
			<Panel title="Profil belum dapat dimuat">
				<p role="alert">Periksa koneksi lalu coba muat ulang.</p>
				<Link href="/peserta/mentor" className="button secondary">
					Kembali ke katalog
				</Link>
			</Panel>
		);
	const { mentor, settings } = data;
	if (!mentor || !settings)
		return (
			<Panel>
				<EmptyState
					title="Mentor tidak tersedia"
					description="Profil mungkin dinonaktifkan atau diarsipkan. Pilih mentor lain dari katalog."
					icon="mentor"
				>
					<Link href="/peserta/mentor" className="button">
						Kembali ke katalog
					</Link>
				</EmptyState>
			</Panel>
		);
	const selected = data.slots.find(
		/** Mengambil pilihan yang masih tersedia berdasarkan snapshot slot dari server. */
		function currentSlot(slot) {
			return slot.id === slotId && slotAvailability(slot, now) === "Tersedia";
		},
	);
	return (
		<>
			<Panel className="mentor-profile-reference">
				<div className="mentor-profile-identity">
					<Avatar
						name={mentor.name}
						photo={mentor.photo_url ?? undefined}
						size="large"
					/>
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
								/** Menampilkan prestasi sesuai profil database. */
								function achievement(text, index) {
									return <li key={`${index}-${text}`}>{text}</li>;
								},
							)}
						</ul>
					</section>
					<section>
						<h3>Ketersediaan</h3>
						<p>
							{mentor.available_dates
								.map(
									/** Memformat tanggal layanan dalam zona waktu acara. */
									function date(day) {
										return formatDate(day);
									},
								)
								.join(" dan ")}
						</p>
						<p>
							Jam operasional {settings.day_start.slice(0, 5)}–
							{settings.day_end.slice(0, 5)} WIB
						</p>
						<p>Slot aktual ditampilkan di bawah.</p>
					</section>
				</div>
			</Panel>
			<Panel
				title="Pilih jadwal mentoring"
				className="mentor-schedule-reference"
			>
				<div className="stack">
					<div className="expertise-filters">
						{settings.dates.map(
							/** Menyajikan hari layanan dengan penjelasan ketika mentor tidak tersedia. */
							function dayOption(day) {
								return mentor.available_dates.includes(day) ? (
									<Link
										key={day}
										href={`?date=${day}`}
										className={`button ${day === data.date ? "" : "secondary"}`}
									>
										{formatDate(day)}
									</Link>
								) : (
									<span
										key={day}
										className="button neutral"
										aria-disabled="true"
									>
										{formatDate(day)} · Tidak tersedia
									</span>
								);
							},
						)}
					</div>
					<p>
						Waktu sesi dalam WIB · {settings.session_minutes} menit + jeda{" "}
						{settings.buffer_minutes} menit
					</p>
					{data.slots.length ? (
						<div className="mentor-slot-grid">
							{data.slots.map(
								/** Memberi label tekstual slot agar kondisi tidak bergantung pada warna. */
								function slotButton(slot) {
									const label = slotAvailability(slot, now);
									/** Menyimpan pilihan sementara tanpa mengirim mutasi ke database. */
									function selectSlot() {
										setSlotId(slot.id);
									}
									return (
										<button
											key={slot.id}
											type="button"
											disabled={label !== "Tersedia"}
											aria-pressed={selected?.id === slot.id}
											className={`mentor-slot ${selected?.id === slot.id ? "is-selected" : ""}`}
											onClick={selectSlot}
										>
											<strong>
												{new Intl.DateTimeFormat("id-ID", {
													timeZone: "Asia/Jakarta",
													hour: "2-digit",
													minute: "2-digit",
												}).format(new Date(slot.starts_at))}
											</strong>
											<small>
												{selected?.id === slot.id ? "Dipilih" : label}
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
						admin menyetujui pengajuan.
					</p>
					<div className="mentor-selection">
						<div>
							<small>Slot terpilih</small>
							<strong>
								{selected
									? `${formatWib(selected.starts_at)}–${new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" }).format(new Date(selected.ends_at))}`
									: "Belum ada slot dipilih"}
							</strong>
						</div>
						<div>
							<small>Mentor</small>
							<strong>{mentor.name}</strong>
						</div>
						<div>
							<small>Identitas Karya</small>
							<Link href="/peserta/karya#informasi-karya">Lihat karya tim</Link>
						</div>
					</div>
					<div className="actions">
						{selected && !data.restriction ? (
							<Link
								className="button"
								href={`/peserta/pengajuan/baru?mentor=${mentor.id}&slot=${selected.id}`}
							>
								Lanjut ke Pengajuan
							</Link>
						) : (
							<button className="button" type="button" disabled>
								Lanjut ke Pengajuan
							</button>
						)}
						<Link className="button neutral" href="/peserta/pengajuan">
							Lihat pengajuan aktif
						</Link>
					</div>
					{data.restriction && (
						<p className="helper">
							{data.restriction}{" "}
							<Link
								className="text-link"
								href={
									data.team ? "/peserta/karya#informasi-karya" : "/peserta/tim"
								}
							>
								{data.team ? "Lihat Identitas Karya" : "Ke Tim Saya"}
							</Link>
						</p>
					)}
				</div>
			</Panel>
		</>
	);
}
