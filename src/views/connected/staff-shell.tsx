// TODO: Pertahankan akses keyboard drawer dan pemisahan sesi nyata dari data demo.
"use client";
import { useState, useTransition, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { SidebarContent } from "@/views/demo/sidebar";
import { Avatar, Icon, Modal } from "@/views/components/ui";
import {
	staffDisplayName,
	staffNavigation,
	type StaffProfile,
} from "@/models/connected/staff";
import "@/views/styles/staff.css";

/** Menyajikan shell staf dengan sidebar peran dan sesi Supabase yang diverifikasi server. */
export function StaffShell({
	profile,
	children,
}: {
	profile: StaffProfile;
	children: ReactNode;
}) {
	const pathname = usePathname();
	const [collapsed, setCollapsed] = useState(false);
	const [drawer, setDrawer] = useState(false);
	const [error, setError] = useState("");
	const [pending, startTransition] = useTransition();
	const name = staffDisplayName(profile);
	const admin = profile.role === "admin";
	const items = staffNavigation(profile.role);
	const active =
		[...items].reverse().find(
			/** Menentukan judul halaman sesuai menu yang paling spesifik. */
			function activeMenu(item) {
				return pathname === item.href || pathname.startsWith(`${item.href}/`);
			},
		) ?? items[0];
	const actor = {
		name,
		role: admin ? ("admin" as const) : ("mentor" as const),
	};
	const accountLabel = admin ? "Administrator" : "Mentor general · akses baca";
	/** Membuka atau menutup sidebar ringkas desktop. */
	function toggle() {
		setCollapsed(!collapsed);
	}
	/** Membuka drawer navigasi mobile. */
	function openDrawer() {
		setDrawer(true);
	}
	/** Menutup drawer dan memulihkan fokus melalui dialog native. */
	function closeDrawer() {
		setDrawer(false);
	}
	/** Mengakhiri sesi nyata tanpa menyentuh repository demo. */
	function logout() {
		setError("");
		startTransition(
			/** Menangani kegagalan jaringan saat mengakhiri sesi. */
			async function endSession() {
				try {
					await signOut();
				} catch {
					setError("Belum berhasil keluar. Periksa koneksi dan coba lagi.");
				}
			},
		);
	}
	return (
		<div className="app-shell staff-shell">
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
					onToggle={toggle}
					onLogout={logout}
					items={items}
					accountLabel={accountLabel}
					areaLabel={admin ? "Area Administrator" : "Area Mentor General"}
				/>
			</aside>
			<div className="app-main">
				<header className="topbar">
					<div className="row">
						<button
							className="icon-button mobile-menu"
							type="button"
							aria-label="Buka menu"
							aria-expanded={drawer}
							onClick={openDrawer}
						>
							<Icon name="menu" />
						</button>
						<div>
							<h1>{active?.label}</h1>
							<p className="muted">
								{admin
									? "Kelola operasional mentoring ADIKARA 2026"
									: "Pantau seluruh mentoring, jadwal, dan karya tim"}
							</p>
						</div>
					</div>
					<div className="header-actions">
						<span className="badge">{accountLabel}</span>
						<Avatar name={name} size="small" />
					</div>
				</header>
				<main className="workspace stack" id="konten">
					{error && (
						<p className="notice danger" role="alert">
							{error}
						</p>
					)}
					{pending && <p role="status">Mengakhiri sesi…</p>}
					{children}
					<footer className="footer-note">
						ADIKARA 2026 · Ruang Mentoring · Seluruh jadwal dalam WIB
					</footer>
				</main>
			</div>
			<Modal
				open={drawer}
				title="Menu ADIKARA"
				onClose={closeDrawer}
				className="navigation-drawer"
			>
				<SidebarContent
					actor={actor}
					pathname={pathname}
					mobile
					onToggle={closeDrawer}
					onLogout={logout}
					items={items}
					accountLabel={accountLabel}
					areaLabel={admin ? "Area Administrator" : "Area Mentor General"}
				/>
			</Modal>
		</div>
	);
}
