// TODO: Verifikasi sesi per permintaan dan tetap periksa otorisasi ulang pada setiap mutasi.
import type { ReactNode } from "react";
import { isDemoMode } from "@/models/demo/mode";
import { requireSession } from "@/lib/auth/session";
import { StaffShell } from "@/views/connected/staff-shell";
/** Menambahkan shell staf terhubung setelah memeriksa peran di server. */
export default async function Layout({ children }: { children: ReactNode }) {
	if (isDemoMode()) return children;
	const { profile } = await requireSession(["admin"]);
	return (
		<StaffShell profile={{ full_name: profile.full_name, role: "admin" }}>
			{children}
		</StaffShell>
	);
}
