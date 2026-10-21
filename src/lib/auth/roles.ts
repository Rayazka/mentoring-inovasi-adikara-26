export const roles = ["participant", "mentor", "admin"] as const;
export type UserRole = (typeof roles)[number];

export function isUserRole(value: unknown): value is UserRole {
  return roles.includes(value as UserRole);
}

export function roleHome(role: UserRole) {
  return { participant: "/peserta", mentor: "/mentor", admin: "/admin" }[role];
}
