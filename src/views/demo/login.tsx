// TODO: Ganti pemilih akun demo dengan tombol Google setelah integrasi produksi disetujui.
"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDemoController } from "@/controllers/demo/use-demo-controller";
import { roleHome } from "@/lib/auth/roles";
import {
	Avatar,
	Button,
	DemoBanner,
	Icon,
	ResourcePanel,
} from "@/views/components/ui";

/** Menampilkan pengenalan program dan akses akun fiktif tanpa menghubungkan Google. */
export function DemoLogin() {
	const { state, actor, dispatch, feedback } = useDemoController();
	const [userId, setUserId] = useState("alya");
	const router = useRouter();
	/** Memilih akun contoh untuk menguji alur lintas peran. */
	function selectAccount(event: React.ChangeEvent<HTMLSelectElement>) {
		setUserId(event.target.value);
	}
	/** Memulai sesi lokal dan mengarahkan pengguna sesuai peran akun yang dipilih. */
	function login(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const selected = state?.users.find(
			/** Mencari akun yang dipilih pada formulir demo. */
			function selectedUser(user) {
				return user.id === userId;
			},
		);
		if (selected && dispatch("session.login", { userId }))
			router.push(roleHome(selected.role));
	}
	if (!state)
		return (
			<main className="loading-screen" role="status">
				Menyiapkan data demo…
			</main>
		);
	return (
		<>
			<header className="public-header">
				<Link href="/" className="brand-lockup" aria-label="ADIKARA 2026">
					<span className="brand-mark">A</span>
					<span>
						ADIKARA<small>INOVASI 2026</small>
					</span>
				</Link>
				<nav className="public-nav" aria-label="Navigasi pengenalan">
					<a href="#tentang">Tentang Mentoring</a>
					<a href="#para-mentor">Mentor</a>
					<a href="#link-penting">Link Penting</a>
					<a className="button secondary small" href="#masuk">
						Masuk <Icon name="arrow" />
					</a>
				</nav>
			</header>
			<main className="public-main stack">
				<DemoBanner />
				<section className="login-hero" id="tentang">
					<div className="hero-copy">
						<span className="eyebrow">MENTORING INOVASI ADIKARA 2026</span>
						<h1>
							Ide hebat dimulai
							<br />
							dari <span className="text-brand">arah yang tepat.</span>
						</h1>
						<p>
							Diskusikan idemu, pertajam arah karyamu, dan melangkah lebih
							percaya diri bersama mentor di bidangnya.
						</p>
						<div className="public-schedule">
							<div>
								<Icon name="calendar" />
								<strong>24–25 Oktober 2026</strong>
								<small>Dua hari untuk langkah besar</small>
							</div>
							<div>
								<Icon name="clock" />
								<strong>18.30–22.00 WIB</strong>
								<small>15 menit sesi + 5 menit jeda</small>
							</div>
						</div>
					</div>
					<section className="login-box" id="masuk">
						<span className="eyebrow">RUANG MENTORINGMU</span>
						<h2>Siap mengembangkan ide?</h2>
						<p>
							Masuk untuk mengelola tim, melengkapi identitas karya, dan
							mengajukan mentoring.
						</p>
						{actor && (
							<div className="notice success">
								Sesi aktif: {actor.name}.{" "}
								<Link className="text-link" href={roleHome(actor.role)}>
									Lanjut ke dashboard <Icon name="arrow" />
								</Link>
							</div>
						)}
						<form onSubmit={login}>
							<label className="field">
								Akun demo
								<select value={userId} onChange={selectAccount}>
									{state.users
										.filter(
											/** Menyembunyikan akun mentor yang sudah dinonaktifkan dari pemilih demo. */
											function availableAccount(user) {
												return (
													user.role !== "mentor" ||
													state.mentors.some(
														/** Mengizinkan hanya profil mentor aktif yang terhubung. */
														function activeMentor(mentor) {
															return (
																mentor.userId === user.id &&
																mentor.active &&
																!mentor.archived
															);
														},
													)
												);
											},
										)
										.map(
											/** Menjelaskan peran setiap akun fiktif pada pilihan masuk. */
											function accountOption(user) {
												return (
													<option key={user.id} value={user.id}>
														{user.name} —{" "}
														{user.role === "participant"
															? "Peserta"
															: user.role === "mentor"
																? "Mentor"
																: "Admin"}
													</option>
												);
											},
										)}
								</select>
							</label>
							<Button type="submit" className="full">
								Masuk ke demo <Icon name="arrow" />
							</Button>
							{feedback?.error && (
								<p className="notice danger" role="alert">
									{feedback.message}
								</p>
							)}
							<p className="helper">
								Semua akun adalah data fiktif. Pilih Sinta untuk mencoba kondisi
								belum memiliki tim. Login Google belum diaktifkan.
							</p>
						</form>
					</section>
				</section>
				<section aria-labelledby="alur">
					<div className="section-heading">
						<div>
							<span className="eyebrow">LANGKAH KECIL, DAMPAK BESAR</span>
							<h2 id="alur">Mulai perjalanan mentoringmu</h2>
						</div>
					</div>
					<div className="steps">
						{[
							"Masuk & bentuk tim",
							"Lengkapi identitas karya",
							"Pilih mentor & jadwal",
							"Diskusi & kembangkan karya",
						].map(
							/** Menampilkan urutan persiapan agar peserta memahami alur sebelum masuk. */
							function mentoringStep(label, index) {
								return (
									<div key={label}>
										<span className="step-number">0{index + 1}</span>
										<h3>{label}</h3>
									</div>
								);
							},
						)}
					</div>
				</section>
				<section id="para-mentor">
					<div className="section-heading">
						<div>
							<span className="eyebrow">TEMUKAN ARAH BERSAMA</span>
							<h2>Kenali para mentor</h2>
							<p>UI/UX, software development, IoT, dan game development.</p>
						</div>
					</div>
					<div className="grid-3">
						{state.mentors
							.filter(
								/** Memilih profil mentor aktif untuk pratinjau publik. */
								function visibleMentor(mentor) {
									return mentor.active && !mentor.archived;
								},
							)
							.slice(0, 3)
							.map(
								/** Menampilkan kartu mentor rata tengah dengan avatar lingkaran dari data fiktif. */
								function mentorPreview(mentor) {
									return (
										<article className="mentor-card" key={mentor.id}>
											<Avatar name={mentor.name} size="large" />
											<div>
												<h3>{mentor.name}</h3>
												<p>{mentor.title}</p>
											</div>
											<span className="tag">{mentor.expertise}</span>
											<a href="#masuk" className="button secondary small">
												Masuk untuk lihat jadwal <Icon name="arrow" />
											</a>
										</article>
									);
								},
							)}
					</div>
				</section>
				<ResourcePanel links={state.resources} />
				<footer className="public-footer">
					<strong>ADIKARA 2026</strong>
					<span>Ruang bertumbuh untuk ide dan inovasi.</span>
					<span>© 2026 · Mode pengembangan</span>
				</footer>
			</main>
		</>
	);
}
