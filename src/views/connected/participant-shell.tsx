// TODO: Pertahankan struktur sidebar peserta dan drawer mobile sesuai referensi Home V2.
"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { participantPage } from "@/views/demo/participant-page";
import { signOut } from "@/app/auth/actions";
import { SidebarContent } from "@/views/demo/sidebar";
import { navigation, activeNavigation } from "@/views/demo/navigation";
import { Avatar, Icon, Modal } from "@/views/components/ui";

/** Memakai kembali sidebar desain peserta dengan identitas sesi nyata tanpa controller demo. */
export function ParticipantShell({
	name,
	children,
}: {
	name: string;
	children: ReactNode;
}) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);
	const [drawer, setDrawer] = useState(false);
	const active = activeNavigation("participant", pathname);
	const home = pathname === "/peserta";
	const page = participantPage(pathname);
	/** Menutup drawer setelah peserta berpindah halaman. */
	useEffect(
		function closeAfterNavigation() {
			setDrawer(false);
		},
		[pathname],
	);
	/** Mengganti lebar sidebar pada desktop. */
	function toggle() {
		setCollapsed(!collapsed);
	}
	/** Membuka navigasi mobile. */
	function open() {
		setDrawer(true);
	}
	/** Menutup navigasi mobile melalui dialog yang mengelola fokus. */
	function close() {
		setDrawer(false);
	}
	/** Mengakhiri sesi Supabase melalui form server tanpa menyentuh penyimpanan demo. */
	function logout() {
		const form = document.getElementById("participant-logout");
		if (form instanceof HTMLFormElement) form.requestSubmit();
	}
	const shared = {
		actor: { name, role: "participant" as const },
		pathname,
		items: navigation.participant,
		accountLabel: "Peserta ADIKARA",
		areaLabel: "Area Peserta",
		onLogout: logout,
	};
	return (
		<div
			className={`app-shell participant-shell ${home ? "home-shell" : "reference-page"}`}
		>
			<a href="#konten" className="skip-link">
				Lewati ke konten
			</a>
			<form id="participant-logout" action={signOut} hidden>
				<button type="submit">Keluar</button>
			</form>
			<aside
				className={`app-sidebar ${collapsed ? "is-collapsed" : ""}`}
				aria-label="Navigasi desktop"
			>
				<SidebarContent {...shared} collapsed={collapsed} onToggle={toggle} />
			</aside>
			<div className="app-main">
				<header className="topbar">
					<div className="row">
						<button
							className="icon-button mobile-menu"
							type="button"
							aria-label="Buka menu"
							aria-expanded={drawer}
							onClick={open}
						>
							<Icon name="menu" />
						</button>
						{home ? (
							<>
								<div className="home-desktop-greeting">
									<h1>Halo, {name.split(" ")[0]}.</h1>
									<p>Home · Kelola tim, karya, dan jadwal mentoringmu.</p>
								</div>
								<strong className="home-mobile-title">Home</strong>
							</>
						) : (
							<div className="page-heading">
								{page && "back" in page && (
									<Link className="page-back" href="/peserta/mentor">
										← Kembali ke katalog mentor
									</Link>
								)}
								<h1>{page?.title ?? active.label}</h1>
								<p>{page?.description ?? "Ruang Mentoring ADIKARA 2026"}</p>
							</div>
						)}
					</div>
					<Avatar name={name} size="small" />
				</header>
				<main id="konten" className="workspace stack">
					{children}
					<footer className="footer-note">
						ADIKARA 2026 · Ruang Mentoring · Seluruh jadwal dalam WIB
					</footer>
				</main>
			</div>
			<Modal
				open={drawer}
				title="Menu ADIKARA"
				onClose={close}
				className="navigation-drawer"
			>
				<SidebarContent {...shared} mobile onToggle={close} />
			</Modal>
		</div>
	);
}
