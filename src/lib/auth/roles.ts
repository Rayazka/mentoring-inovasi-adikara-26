// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
export const roles = [
	"participant",
	"mentor",
	"mentor_general",
	"admin",
] as const;
export type UserRole = (typeof roles)[number];

/** Memeriksa apakah nilai role termasuk peran aplikasi yang dikenal. */
export function isUserRole(value: unknown): value is UserRole {
	return roles.includes(value as UserRole);
}

/** Menentukan halaman awal berdasarkan peran pengguna. */
export function roleHome(role: UserRole) {
	return {
		participant: "/peserta",
		mentor: "/mentor",
		mentor_general: "/mentor",
		admin: "/admin",
	}[role];
}

/** Menerima hanya peran rilis aktif berdasarkan profil database, bukan metadata browser. */
export function canAccessConnectedApp(
	profile: { role: unknown; is_active?: boolean } | null,
) {
	return Boolean(
		profile?.is_active &&
			["participant", "mentor_general", "admin"].includes(String(profile.role)),
	);
}

/** Membatasi login password pada admin dan mentor general yang aktif. */
export function canSignInAsStaff(
	profile: { role: unknown; is_active?: boolean } | null,
) {
	return (
		canAccessConnectedApp(profile) &&
		(profile?.role === "admin" || profile?.role === "mentor_general")
	);
}
