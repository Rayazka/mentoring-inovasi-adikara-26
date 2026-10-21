// TODO: Hubungkan setiap halaman fitur melalui registry tanpa memindahkan aturan bisnis ke view.
"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { roleHome } from "@/lib/auth/roles";
import { useDemoController } from "@/controllers/demo/use-demo-controller";
import {
	Avatar,
	Button,
	DemoBanner,
	EmptyState,
	Icon,
	Modal,
	Panel,
	formatDate,
} from "@/views/components/ui";
import { activeNavigation } from "./navigation";
import { SidebarContent } from "./sidebar";
import { participantPage } from "./participant-page";
import { demoViews } from "./registry";
import "./team";
import "./work";
import "./admin-mentors";
import "./schedules";
import "./mentor-profile";
import "./catalog";
import "./request-submit";
import "./requests";
import "./review";
import "./revision";
import "./reschedule";
import "./cancellation";
import "./participant-home";
import { participantHomeData } from "@/controllers/demo/home-controller";

/** Menyajikan shell aplikasi lokal dengan pemeriksaan peran dan navigasi aksesibel. */
export function DemoApplication() {
	const controller = useDemoController();
	const { state, actor, dispatch, feedback, dismissFeedback } = controller;
	const pathname = usePathname();
	const router = useRouter();
	const [collapsed, setCollapsed] = useState(false);
	const [drawer, setDrawer] = useState(false);
	const [notifications, setNotifications] = useState(false);
	const [reset, setReset] = useState(false);
	/** Mengarahkan sesi demo yang tidak sesuai menuju halaman yang dapat diakses. */
	useEffect(
		function guardDemoRoute() {
			if (!state) return;
			if (!actor) {
				router.replace("/");
				return;
			}
			const home = roleHome(actor.role);
			if (pathname !== home && !pathname.startsWith(`${home}/`))
				router.replace(home);
		},
		[state, actor, pathname, router],
	);
	/** Menutup drawer saat pengguna berpindah halaman. */
	useEffect(
		function closeDrawerOnNavigation() {
			setDrawer(false);
		},
		[pathname],
	);
	/** Membuka atau menutup panel navigasi ringkas. */
	function toggleCollapse() {
		setCollapsed(!collapsed);
	}
	/** Menampilkan navigasi mobile dengan pengelolaan fokus dialog native. */
	function openDrawer() {
		setDrawer(true);
	}
	/** Menutup navigasi mobile. */
	function closeDrawer() {
		setDrawer(false);
	}
	/** Menampilkan notifikasi milik akun yang sedang aktif. */
	function openNotifications() {
		setNotifications(true);
	}
	/** Menutup daftar notifikasi. */
	function closeNotifications() {
		setNotifications(false);
	}
	/** Menandai semua notifikasi akun sebagai sudah dibaca. */
	function markRead() {
		dispatch("session.read-notifications");
	}
	/** Mengakhiri sesi lokal sebelum kembali ke halaman masuk. */
	function logout() {
		if (dispatch("session.logout")) router.replace("/");
	}
	/** Meminta konfirmasi sebelum data latihan dihapus. */
	function openReset() {
		setReset(true);
	}
	/** Membatalkan penghapusan data latihan. */
	function closeReset() {
		setReset(false);
	}
	/** Memulihkan data contoh serta mengakhiri sesi lokal. */
	function resetData() {
		if (dispatch("session.reset")) router.replace("/");
	}
	if (!state || !actor)
		return (
			<main className="loading-screen" role="status">
				Memuat ruang mentoring…
			</main>
		);
	const home = roleHome(actor.role);
	if (pathname !== home && !pathname.startsWith(`${home}/`))
		return (
			<main className="loading-screen" role="status">
				Mengalihkan halaman…
			</main>
		);
	const active = activeNavigation(actor.role, pathname);
	const page =
		actor.role === "participant" ? participantPage(pathname) : undefined;
	const isParticipantHome = actor.role === "participant" && pathname === home;
	const homeData = isParticipantHome ? participantHomeData(state, actor) : null;
	const inbox = state.notifications.filter(
		/** Membatasi notifikasi pada pemilik sesi lokal. */
		function ownedNotification(item) {
			return item.userId === actor.id;
		},
	);
	const unread = inbox.filter(
		/** Menghitung pemberitahuan yang belum dibaca. */
		function unreadNotification(item) {
			return !item.read;
		},
	).length;
	const match = [...demoViews.entries()]
		.sort(
			/** Mengutamakan halaman detail dibandingkan halaman induk. */
			function longestPrefix(a, b) {
				return b[0].length - a[0].length;
			},
		)
		.find(
			/** Memilih tampilan terdaftar untuk route aktif. */
			function matchingView([prefix]) {
				return pathname === prefix || pathname.startsWith(`${prefix}/`);
			},
		);
	const View = match?.[1];
	return (
		<div
			className={`app-shell ${actor.role === "participant" ? "participant-shell" : ""} ${isParticipantHome ? "home-shell" : ""} ${page ? "reference-page" : ""}`}
		>
			<a className="skip-link" href="#konten">
				Lewati ke konten
			</a>
			<aside
				className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
				aria-label="Navigasi desktop"
			>
				<SidebarContent
					actor={actor}
					pathname={pathname}
					collapsed={collapsed}
					onToggle={toggleCollapse}
					onLogout={logout}
				/>
			</aside>
			<div className="app-main">
				<header className="topbar">
					<div className="row">
						<button
							className="icon-button mobile-menu"
							type="button"
							onClick={openDrawer}
							aria-label="Buka menu"
							aria-expanded={drawer}
						>
							<Icon name="menu" />
						</button>
						{page ? (
							<div className="page-heading">
								{"back" in page && (
									<Link className="page-back" href="/peserta/mentor">
										← Kembali ke katalog mentor
									</Link>
								)}
								<h1>{page.title}</h1>
								<p>{page.description}</p>
							</div>
						) : homeData ? (
							<>
								<div className="home-desktop-greeting">
									<h1>Halo, {actor.name.split(" ")[0]}.</h1>
									<p>Home · {homeData.greeting}</p>
								</div>
								<strong className="home-mobile-title">Home</strong>
							</>
						) : (
							<strong>{active.label}</strong>
						)}
					</div>
					<div className="header-actions">
						<span
							className="demo-indicator"
							title="Mode demo lokal · data contoh · Google belum terhubung"
						>
							Demo lokal
						</span>
						<button
							type="button"
							className={`icon-button ${isParticipantHome || page ? "home-notifications" : ""}`}
							onClick={openNotifications}
							aria-label={`Notifikasi, ${unread} belum dibaca`}
						>
							<Icon name="bell" />
							{(isParticipantHome || page) && (
								<span className="notification-label">Notifikasi</span>
							)}
							{unread > 0 && <span>{unread}</span>}
						</button>
						<Avatar name={actor.name} size="small" />
					</div>
				</header>
				<main className="workspace stack" id="konten">
					{!isParticipantHome && !page && <DemoBanner />}
					{state.recovery && (
						<p className="notice warning" role="status">
							{state.recovery}
						</p>
					)}
					{feedback && (
						<div
							className={`notice ${feedback.error ? "danger" : "success"}`}
							role={feedback.error ? "alert" : "status"}
						>
							<div className="row spread">
								<span>{feedback.message}</span>
								<button
									className="icon-button"
									type="button"
									onClick={dismissFeedback}
									aria-label="Tutup pesan"
								>
									<Icon name="close" />
								</button>
							</div>
						</div>
					)}
					{View ? (
						<View controller={controller} pathname={pathname} />
					) : (
						<Panel title={active.label}>
							<EmptyState
								title="Ruang mentoring siap digunakan"
								description="Halaman fitur sedang dihubungkan ke alur demo. Gunakan menu untuk menjelajahi aplikasi."
							/>
						</Panel>
					)}
					<div className="footer-note row spread">
						<span>ADIKARA 2026 · Ruang bertumbuh untuk inovasimu</span>
						<button className="text-link" type="button" onClick={openReset}>
							Reset data demo
						</button>
					</div>
					{(isParticipantHome || page) && (
						<div className="home-demo-disclosure">
							<DemoBanner />
						</div>
					)}
				</main>
			</div>
			<Modal
				open={drawer}
				title={actor.role === "participant" ? "Area Peserta" : "Menu ADIKARA"}
				onClose={closeDrawer}
				className="navigation-drawer"
			>
				<SidebarContent
					actor={actor}
					pathname={pathname}
					mobile
					onToggle={closeDrawer}
					onLogout={logout}
				/>
			</Modal>
			<Modal
				open={notifications}
				title="Notifikasi"
				onClose={closeNotifications}
			>
				<div className="stack">
					{inbox.length ? (
						inbox.map(
							/** Menghubungkan pemberitahuan dengan halaman tindakan terkait. */
							function notificationRow(item) {
								return (
									<Link
										className="subtle-box"
										key={item.id}
										href={item.href}
										onClick={closeNotifications}
									>
										<strong>{item.title}</strong>
										<small>
											{formatDate(item.at, true)} ·{" "}
											{item.read ? "Sudah dibaca" : "Baru"}
										</small>
									</Link>
								);
							},
						)
					) : (
						<p>Belum ada notifikasi.</p>
					)}
					<Button variant="secondary" onClick={markRead} disabled={!unread}>
						Tandai semua dibaca
					</Button>
				</div>
			</Modal>
			<Modal open={reset} title="Reset seluruh data demo?" onClose={closeReset}>
				<p>
					Perubahan akun, tim, karya dan jadwal di browser ini akan diganti
					dengan contoh awal.
				</p>
				<div className="actions">
					<Button variant="neutral" onClick={closeReset}>
						Batal
					</Button>
					<Button variant="danger" onClick={resetData}>
						Reset demo
					</Button>
				</div>
			</Modal>
		</div>
	);
}
