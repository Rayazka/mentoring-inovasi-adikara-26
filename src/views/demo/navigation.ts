// TODO: Sinkronkan navigasi peran saat cakupan halaman bertambah.
import type { Role } from "@/models/demo/types";
import type { IconName } from "@/views/components/ui";

export interface NavigationItem {
	href: string;
	label: string;
	icon: IconName;
}
export const navigation: Record<Role, NavigationItem[]> = {
	participant: [
		{ href: "/peserta", label: "Home", icon: "home" },
		{ href: "/peserta/tim", label: "Tim Saya", icon: "team" },
		{ href: "/peserta/karya", label: "Identitas Karya", icon: "file" },
		{ href: "/peserta/mentor", label: "Cari Mentor", icon: "mentor" },
		{
			href: "/peserta/pengajuan",
			label: "Pengajuan Mentoring",
			icon: "request",
		},
	],
	mentor: [
		{ href: "/mentor", label: "Home", icon: "home" },
		{
			href: "/mentor/pengajuan",
			label: "Pengajuan Mentoring",
			icon: "request",
		},
		{ href: "/mentor/jadwal", label: "Ketersediaan Jadwal", icon: "calendar" },
		{ href: "/mentor/profil", label: "Profil Saya", icon: "mentor" },
	],
	admin: [
		{ href: "/admin", label: "Home", icon: "home" },
		{ href: "/admin/mentor", label: "Kelola Mentor", icon: "mentor" },
		{ href: "/admin/jadwal", label: "Kelola Jadwal", icon: "calendar" },
		{ href: "/admin/operasional", label: "Operasional", icon: "request" },
		{ href: "/admin/link", label: "Link Penting", icon: "external" },
		{ href: "/admin/akun", label: "Akun & Peran", icon: "team" },
		{ href: "/admin/audit", label: "Riwayat Aktivitas", icon: "file" },
	],
};

/** Memilih menu induk yang paling spesifik untuk route detail maupun halaman utama. */
export function activeNavigation(role: Role, pathname: string) {
	return (
		[...navigation[role]].reverse().find(
			/** Mencocokkan awalan route tanpa menganggap halaman home aktif di semua halaman. */
			function matchingRoute(item) {
				return pathname === item.href || pathname.startsWith(`${item.href}/`);
			},
		) ?? navigation[role][0]
	);
}
