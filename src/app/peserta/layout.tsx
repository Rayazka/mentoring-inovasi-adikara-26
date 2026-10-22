// TODO: Verifikasi ulang sesi pada setiap controller selain pemeriksaan shell peserta.
import type { ReactNode } from "react";
import { requireSession } from "@/lib/auth/session";
import { isDemoMode } from "@/models/demo/mode";
import { ParticipantShell } from "@/views/connected/participant-shell";

/** Memasang shell peserta yang sama dengan desain demo menggunakan identitas sesi produksi. */
export default async function ParticipantLayout({
	children,
}: {
	children: ReactNode;
}) {
	if (isDemoMode()) return children;
	const { profile } = await requireSession(["participant"]);
	return (
		<ParticipantShell name={profile.full_name ?? "Peserta ADIKARA"}>
			{children}
		</ParticipantShell>
	);
}
