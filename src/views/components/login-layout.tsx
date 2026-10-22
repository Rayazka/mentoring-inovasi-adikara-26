// TODO: Pertahankan struktur frame M2j3WV saat metode autentikasi berkembang.
"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { publicAssets } from "@/models/public-assets";
import { Brand } from "@/views/components/brand";
import { Button, Icon } from "@/views/components/ui";
import "@/views/styles/login.css";
const categories = [
	"Competitive Programming",
	"Data Mining",
	"Cyber Security",
	"Entrepreneurship",
	"Innovation",
];

/** Menyajikan tampilan publik bersama tanpa membaca sesi atau penyimpanan demo. */
export function LoginLayout({
	dateLabel,
	onLogin,
	authentication,
	resources,
	children,
	showIcon = false,
}: {
	dateLabel: string;
	onLogin: () => void;
	authentication: ReactNode;
	resources: ReactNode;
	children?: ReactNode;
	showIcon?: boolean;
}) {
	const [menuOpen, setMenuOpen] = useState(false);
	/** Membuka atau menutup navigasi pada layar kecil. */
	function toggleMenu() {
		setMenuOpen(!menuOpen);
	}
	/** Menutup navigasi setelah pengguna memilih tujuan. */
	function closeMenu() {
		setMenuOpen(false);
	}
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
						<Button onClick={onLogin} className="login-navbar-cta">
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
						{showIcon && (
							<Image
								src={publicAssets["login-icon"]}
								alt=""
								className="login-card-icon"
								width={44}
								height={68}
								unoptimized
							/>
						)}
						<div className="login-card-heading">
							<h2 id="judul-form">Selamat datang</h2>
							<p>
								Masuk untuk mengelola tim, dokumen,
								<br className="login-desktop-break" /> dan sesi mentoring
								ADIKARA 2026.
							</p>
						</div>
						{authentication}
					</div>
				</section>
				<section
					className="login-resources"
					aria-label="Sumber resmi mentoring"
				>
					{resources}
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
			{children}
		</div>
	);
}
