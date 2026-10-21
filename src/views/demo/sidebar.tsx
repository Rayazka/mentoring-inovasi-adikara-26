// TODO: Cocokkan varian peran berikutnya dengan ekspor sidebar terbaru tanpa mengubah aturan navigasi.
import Link from "next/link";
import type { DemoUser } from "@/models/demo/types";
import { roleHome } from "@/lib/auth/roles";
import { Brand } from "@/views/components/brand";
import { Avatar, Icon, type IconName } from "@/views/components/ui";
import { activeNavigation, navigation } from "./navigation";

const sidebarPaths: Partial<Record<IconName, string>> = {
	home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
	team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
	file: "M12 10H3M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v3m-5 10 5.5-5.5a2.12 2.12 0 0 0-3-3L13 18v3Z",
	mentor: "m22 10-10-5L2 10l10 5 10-5ZM6 12v5c3 3 9 3 12 0v-5M22 10v6",
	request:
		"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m4 12 2 2 4-4",
	logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14 5-5-5-5M21 12H9",
};

/** Menampilkan bentuk ikon navigasi yang sesuai dengan referensi pengguna. */
function SidebarIcon({ name }: { name: IconName }) {
	const path = sidebarPaths[name];
	return path ? (
		<svg
			className="icon"
			viewBox="0 0 24 24"
			aria-hidden="true"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d={path} />
		</svg>
	) : (
		<Icon name={name} />
	);
}

/** Menyajikan struktur sidebar yang sama untuk desktop dan drawer, dengan menu sesuai peran. */
export function SidebarContent({
	actor,
	pathname,
	collapsed = false,
	mobile = false,
	onToggle,
	onLogout,
}: {
	actor: DemoUser;
	pathname: string;
	collapsed?: boolean;
	mobile?: boolean;
	onToggle: () => void;
	onLogout: () => void;
}) {
	const active = activeNavigation(actor.role, pathname);
	const area =
		actor.role === "participant"
			? "Area Peserta"
			: actor.role === "mentor"
				? "Area Mentor"
				: "Administrator";
	return (
		<div className={`sidebar-content ${collapsed ? "is-collapsed" : ""}`}>
			<div className="sidebar-identity">
				<div className="sidebar-brand-row">
					<Link
						href={roleHome(actor.role)}
						className="sidebar-brand"
						aria-label="ADIKARA Home"
					>
						<Brand compact={collapsed} source="login-logo" />
					</Link>
					<button
						className="sidebar-toggle"
						type="button"
						onClick={onToggle}
						aria-label={
							mobile
								? "Tutup menu"
								: collapsed
									? "Perluas sidebar"
									: "Ringkas sidebar"
						}
						aria-expanded={mobile ? undefined : !collapsed}
						title={
							mobile
								? "Tutup menu"
								: collapsed
									? "Perluas sidebar"
									: "Ringkas sidebar"
						}
					>
						{mobile ? (
							<Icon name="close" />
						) : (
							<svg
								className="icon"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d={collapsed ? "m9 6 6 6-6 6" : "m15 6-6 6 6 6"} />
							</svg>
						)}
					</button>
				</div>
				<p className="sidebar-area">{area}</p>
				<nav className="sidebar-navigation" aria-label="Menu utama">
					{navigation[actor.role].map(
						/** Menandai menu induk aktif sekaligus mempertahankan nama aksesibel dalam mode ringkas. */
						function navigationLink(item) {
							return (
								<Link
									key={item.href}
									href={item.href}
									className={`sidebar-link ${active.href === item.href ? "is-active" : ""}`}
									aria-current={active.href === item.href ? "page" : undefined}
									aria-label={item.label}
									title={collapsed ? item.label : undefined}
								>
									<SidebarIcon name={item.icon} />
									<span className="sidebar-label">{item.label}</span>
								</Link>
							);
						},
					)}
				</nav>
			</div>
			<div className="sidebar-account-section">
				<div
					className="sidebar-account"
					title={collapsed ? `${actor.name} · Akun demo` : undefined}
				>
					<Avatar name={actor.name} size="small" />
					<div className="sidebar-account-copy">
						<strong>{actor.name}</strong>
						<span>Akun demo</span>
					</div>
				</div>
				<button
					className="sidebar-logout"
					type="button"
					onClick={onLogout}
					aria-label="Keluar"
					title={collapsed ? "Keluar" : undefined}
				>
					<SidebarIcon name="logout" />
					<span className="sidebar-label">Keluar</span>
				</button>
			</div>
		</div>
	);
}
