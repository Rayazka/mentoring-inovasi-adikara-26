// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
export const roles = ["participant", "mentor", "admin"] as const;
export type UserRole = (typeof roles)[number];

/** Memeriksa apakah nilai role termasuk peran aplikasi yang dikenal. */
export function isUserRole(value: unknown): value is UserRole {
	return roles.includes(value as UserRole);
}

/** Menentukan halaman awal berdasarkan peran pengguna. */
export function roleHome(role: UserRole) {
	return { participant: "/peserta", mentor: "/mentor", admin: "/admin" }[role];
}
