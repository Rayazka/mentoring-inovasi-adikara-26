// TODO: Tambahkan sorotan berbasis aturan ketika alur reschedule dan review terhubung.
import "server-only";
import { requireSession } from "@/lib/auth/session";
import { readStaffSummary } from "@/models/connected/operations-repository";
import { staffDisplayName, type StaffRole } from "@/models/connected/staff";
/** Memverifikasi staf dan menyediakan ringkasan yang hanya berasal dari Supabase. */
export async function loadStaffDashboard(role: StaffRole) {
	const { supabase, profile } = await requireSession([role]);
	const name = staffDisplayName({ full_name: profile.full_name, role });
	try {
		return {
			name,
			role,
			summary: await readStaffSummary(supabase, role === "admin"),
			error: null,
		};
	} catch {
		return {
			name,
			role,
			summary: null,
			error:
				"Ringkasan belum berhasil dimuat. Periksa koneksi dan instalasi database, lalu coba lagi.",
		};
	}
}
