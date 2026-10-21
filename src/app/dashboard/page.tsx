// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { roleHome } from "@/lib/auth/roles";
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";

export const dynamic = "force-dynamic";

/** Mengarahkan pengguna ke dashboard sesuai peran yang terverifikasi. */
export default async function Dashboard() {
	if (isDemoMode()) return <DemoApplication />;
	const { profile } = await requireSession();
	redirect(roleHome(profile.role));
}
