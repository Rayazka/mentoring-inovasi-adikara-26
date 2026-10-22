// TODO: Pertahankan route sebagai adapter tipis untuk dashboard staf terhubung.
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadStaffDashboard } from "@/controllers/connected/staff-dashboard";
import { StaffDashboard } from "@/views/connected/staff-dashboard";
export const dynamic = "force-dynamic";
/** Menyajikan dashboard berdasarkan sesi staf dan data operasional nyata. */
export default async function Page() {
	if (isDemoMode()) return <DemoApplication />;
	return <StaffDashboard data={await loadStaffDashboard("mentor_general")} />;
}
