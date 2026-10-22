// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { requireSession } from "@/lib/auth/session";
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { signOut } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

/** Menampilkan halaman awal mentor yang berhak. */
export default async function MentorPage() {
	if (isDemoMode()) return <DemoApplication />;
	const { profile } = await requireSession(["mentor_general"]);
	return (
		<main>
			<h1>Home Mentor</h1>
			<p>Halo, {profile.full_name}.</p>
			<form action={signOut}>
				<button type="submit">Keluar</button>
			</form>
		</main>
	);
}
