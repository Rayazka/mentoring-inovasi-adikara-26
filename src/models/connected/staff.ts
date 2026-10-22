// TODO: Sinkronkan daftar menu dengan fitur terhubung yang sudah tersedia.
export interface StaffNavigationItem {
	href: string;
	label: string;
	icon:
		| "home"
		| "mentor"
		| "calendar"
		| "request"
		| "file"
		| "team"
		| "external";
}
export type StaffRole = "admin" | "mentor_general";
export interface StaffProfile {
	full_name: string | null;
	role: StaffRole;
}

/** Menampilkan nama staf yang sesuai ketika trigger lama memakai nama peserta generik. */
export function staffDisplayName(profile: StaffProfile) {
	const name = profile.full_name?.trim();
	return name && name !== "Peserta ADIKARA"
		? name
		: profile.role === "admin"
			? "Admin ADIKARA"
			: "Mentor ADIKARA";
}

/** Mengembalikan menu yang tersedia bagi peran sesi tanpa memberi otorisasi mutasi. */
export function staffNavigation(role: StaffRole): StaffNavigationItem[] {
	return [
		{
			href: role === "admin" ? "/admin" : "/mentor",
			label: role === "admin" ? "Ringkasan" : "Beranda",
			icon: "home",
		},
	];
}
