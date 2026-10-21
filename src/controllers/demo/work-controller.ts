// TODO: Pindahkan pembaruan karya dan audit ke transaksi server pada mode produksi.
import type { DemoState } from "@/models/demo/types";
import { actorTeam, audit, requireActor, requiredText } from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Menyimpan identitas karya milik tim sebagai draf parsial atau data lengkap tervalidasi. */
export function workCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	const team = actorTeam(state);
	if (actor.role !== "participant" || !team)
		throw new Error(
			"Bergabung dengan tim terlebih dahulu untuk mengisi Identitas Karya.",
		);
	if (action !== "work.save" && action !== "work.draft")
		throw new Error("Tindakan karya tidak dikenal.");
	const title = textValue(payload, "title").trim();
	const description = textValue(payload, "description").trim();
	if (title.length > 150 || description.length > 5000)
		throw new Error(
			"Judul maksimal 150 karakter dan deskripsi maksimal 5.000 karakter.",
		);
	if (action === "work.save") {
		requiredText(title, "Judul topik", 150);
		requiredText(description, "Deskripsi topik", 5000);
	}
	const current = state.works.find(
		/** Mengambil karya yang hanya dimiliki tim aktif pengguna. */
		function existingWork(item) {
			return item.teamId === team.id;
		},
	);
	const next = {
		teamId: team.id,
		title,
		description,
		updatedAt: new Date().toISOString(),
	};
	if (current) Object.assign(current, next);
	else state.works.push(next);
	audit(
		state,
		action === "work.draft"
			? "Draf karya disimpan"
			: "Identitas karya diperbarui",
		team.id,
	);
	return action === "work.draft"
		? "Draf identitas karya tersimpan."
		: "Identitas karya berhasil disimpan.";
}
