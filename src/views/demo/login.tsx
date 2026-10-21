// TODO: Hubungkan Google setelah integrasi produksi siap tanpa mengubah struktur frame M2j3WV.
"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDemoController } from "@/controllers/demo/use-demo-controller";
import { roleHome } from "@/lib/auth/roles";
import { Brand } from "@/views/components/brand";
import { Button, Icon, Modal, ResourcePanel } from "@/views/components/ui";
import "@/views/styles/login.css";

const categories = [
	"Competitive Programming",
	"Data Mining",
	"Cyber Security",
	"Entrepreneurship",
	"Innovation",
];

/** Menyajikan halaman login sesuai HTML frame M2j3WV dengan autentikasi demo yang terpisah. */
export function DemoLogin() {
	const { state, actor, dispatch, feedback } = useDemoController();
	const [open, setOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const [userId, setUserId] = useState("alya");
	const router = useRouter();
	/** Membuka pilihan akun contoh tanpa menghubungi layanan Google. */
	function openLogin() {
		setOpen(true);
		setMenuOpen(false);
	}
	/** Menutup pilihan akun dan mengembalikan fokus ke tombol masuk. */
	function closeLogin() {
		setOpen(false);
	}
	/** Menampilkan navigasi publik pada layar kecil. */
	function toggleMenu() {
		setMenuOpen(!menuOpen);
	}
	/** Menutup navigasi setelah peserta memilih bagian halaman. */
	function closeMenu() {
		setMenuOpen(false);
	}
	/** Mengubah akun contoh yang akan digunakan untuk mencoba aplikasi. */
	function selectAccount(event: ChangeEvent<HTMLSelectElement>) {
		setUserId(event.target.value);
	}
	/** Memulai sesi lokal yang sah lalu mengarahkan pengguna sesuai perannya. */
	function login(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const selected = state?.users.find(
			/** Mencari akun yang dipilih dari data demo yang sudah dimuat. */
			function selectedUser(user) {
				return user.id === userId;
			},
		);
		if (selected && dispatch("session.login", { userId })) {
			closeLogin();
			router.push(roleHome(selected.role));
		}
	}
	const dates = state?.settings.dates ?? ["2026-10-24", "2026-10-25"];
	const start = dates[0];
	const end = dates[dates.length - 1];
	const dateLabel =
		start && end
			? `${Number(start.slice(8))}${start !== end ? `–${Number(end.slice(8))}` : ""} ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${end}T12:00:00+07:00`))}`
			: "Tanggal mentoring akan diumumkan";
	return (
		<div className="login-page" id="beranda">
			<a href="#masuk" className="skip-link">
				Lewati ke formulir masuk
			</a>
			<header className="login-header">
				<div className="login-navbar">
					<Link
						href="#beranda"
						className="brand-lockup"
						aria-label="ADIKARA 2026"
					>
						<Brand source="login-logo" />
					</Link>
					<nav
						className={`login-navigation ${menuOpen ? "is-open" : ""}`}
						aria-label="Navigasi publik"
						id="navigasi-login"
					>
						<Link href="#beranda" onClick={closeMenu}>
							Beranda
						</Link>
						<Link
							href="#mentoring"
							className="is-active"
							aria-current="location"
							onClick={closeMenu}
						>
							Mentoring
						</Link>
						<Link href="#link-penting" onClick={closeMenu}>
							Link Penting
						</Link>
					</nav>
					<div className="row">
						<Button onClick={openLogin} className="login-navbar-cta">
							Masuk
						</Button>
						<button
							type="button"
							className="icon-button login-menu-toggle"
							aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
							aria-expanded={menuOpen}
							aria-controls="navigasi-login"
							onClick={toggleMenu}
						>
							<Icon name={menuOpen ? "close" : "menu"} />
						</button>
					</div>
				</div>
			</header>
			<main>
				<section
					className="login-introduction"
					id="mentoring"
					aria-labelledby="judul-login"
				>
					<div className="login-hero-pattern" aria-hidden="true" />
					<div
						className="login-ornament login-ornament-left"
						aria-hidden="true"
					/>
					<div
						className="login-ornament login-ornament-right"
						aria-hidden="true"
					/>
					<div className="login-introduction-copy">
						<p className="login-event-name">ADIKARA 2026</p>
						<h1 id="judul-login">Ruang Mentoring</h1>
						<p className="login-introduction-description">
							Diskusikan proyekmu bersama mentor, tajamkan ide,
							<br className="login-desktop-break" /> dan siapkan langkah
							berikutnya bersama tim.
						</p>
						<p className="login-event-date">{dateLabel}</p>
					</div>
				</section>
				<section
					className="login-form-section"
					id="masuk"
					aria-labelledby="judul-form"
				>
					<div className="login-form-ornaments" aria-hidden="true">
						<div className="login-form-ornament left" />
						<div className="login-form-ornament right" />
					</div>
					<div className="login-form-pattern" aria-hidden="true" />
					<div className="login-form-card">
						<Image
							src="/api/demo-assets/login-icon"
							alt=""
							className="login-card-icon"
							width={44}
							height={68}
							unoptimized
						/>
						<div className="login-card-heading">
							<h2 id="judul-form">Selamat datang</h2>
							<p>
								Masuk untuk mengelola tim, dokumen,
								<br className="login-desktop-break" /> dan sesi mentoring
								ADIKARA 2026.
							</p>
						</div>
						<button
							type="button"
							className="login-provider-button"
							onClick={openLogin}
						>
							<Icon name="logout" />
							<span>Masuk ke demo</span>
						</button>
						<p className="login-method-note">
							Mode demo · Login Google belum terhubung.
						</p>
						<hr className="login-card-divider" />
						{actor && (
							<Link className="login-resume" href={roleHome(actor.role)}>
								Lanjutkan sebagai {actor.name} <Icon name="arrow" />
							</Link>
						)}
					</div>
				</section>
				<section
					className="login-resources"
					aria-label="Sumber resmi mentoring"
				>
					{state ? (
						<ResourcePanel links={state.resources} />
					) : (
						<div className="login-resource-loading" role="status">
							Memuat link penting…
						</div>
					)}
				</section>
			</main>
			<footer className="login-footer">
				<div className="login-footer-main">
					<div className="login-footer-about">
						<Link href="#beranda" aria-label="ADIKARA 2026">
							<Brand source="login-logo" />
						</Link>
						<p>
							Ajang Digital Kreatif dan Inovasi Informatika. Diselenggarakan
							oleh Fakultas Informatika dan Laboratorium Digital Talent Centre,
							Telkom University.
						</p>
						<div className="login-social-marks" aria-hidden="true">
							<span className="login-social-instagram">
								<i />
							</span>
							<span className="login-social-youtube">
								<i />
							</span>
							<span className="login-social-linkedin">in</span>
						</div>
					</div>
					<div className="login-footer-column">
						<h2>Tautan Cepat</h2>
						<ul>
							<li>
								<a
									href="https://adikara.helloprodigi.pro/"
									target="_blank"
									rel="noreferrer"
								>
									Kompetisi <span className="sr-only">(situs ADIKARA)</span>
								</a>
							</li>
							<li>
								<a href="#mentoring">Linimasa</a>
							</li>
							<li>
								<a href="#link-penting">Dokumen</a>
							</li>
							<li>
								<span>Statistik</span>
							</li>
							<li>
								<span>Peringkat</span>
							</li>
						</ul>
					</div>
					<div className="login-footer-column">
						<h2>Kategori</h2>
						<ul>
							{categories.map(
								/** Menampilkan kategori dari acuan tanpa membuat tujuan tautan yang belum tersedia. */
								function categoryItem(category) {
									return <li key={category}>{category}</li>;
								},
							)}
						</ul>
					</div>
					<div className="login-footer-column login-footer-contact">
						<h2>Hubungi Kami</h2>
						<p>
							Digital Talent Centre Lab, Telkom University Landmark Tower (TULT)
							15th floor, Jl. Telekomunikasi No. 1, Terusan Buahbatu, Bandung
							40257
						</p>
					</div>
				</div>
				<div className="login-copyright">
					© 2026 ADIKARA. Seluruh hak dilindungi. | Dirancang &amp; dikembangkan
					oleh Product Team PRODIGI
				</div>
			</footer>
			<Modal open={open} title="Masuk demo ADIKARA" onClose={closeLogin}>
				<form className="stack" onSubmit={login}>
					<p className="notice">
						Google belum terhubung. Pilih akun fiktif untuk mencoba alur
						peserta, mentor, atau admin. Data demo tersimpan pada browser ini.
					</p>
					<label htmlFor="akun-demo-login" className="field">
						Akun demo
					</label>
					<select
						id="akun-demo-login"
						className="login-account-select"
						value={userId}
						onChange={selectAccount}
						disabled={!state}
					>
						{state?.users
							.filter(
								/** Membatasi pemilih pada peserta, admin dan akun mentor yang profilnya masih aktif. */
								function availableAccount(user) {
									return (
										user.role !== "mentor" ||
										state.mentors.some(
											/** Memastikan akun mentor yang ditawarkan masih terhubung dengan profil aktif. */
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
								/** Menjelaskan nama dan peran setiap akun contoh sebelum sesi dimulai. */
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
					{feedback?.error && (
						<p className="notice danger" role="alert">
							{feedback.message}
						</p>
					)}
					<div className="actions">
						<Button variant="neutral" onClick={closeLogin}>
							Batal
						</Button>
						<Button type="submit" disabled={!state}>
							Masuk ke demo
						</Button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
