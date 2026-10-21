// TODO: Pertahankan pelaporan akses manual karena penyimpanan link tidak mengubah izin Google Drive.
import type { DemoState } from "@/models/demo/types";
import {
	actorTeam,
	audit,
	newId,
	notify,
	requireActor,
	requiredText,
	safeUrl,
} from "./context";
import { requireDocumentAccess } from "./document-access";
import { textValue, type CommandPayload } from "./session-controller";

/** Menyimpan link Drive tim atau mencatat laporan mentor bahwa bahan belum dapat dibuka. */
export function driveCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	if (action === "drive.report") {
		if (actor.role !== "mentor")
			throw new Error("Pelaporan ini hanya tersedia bagi mentor terkait.");
		const document = requireDocumentAccess(state, textValue(payload, "id"));
		document.inaccessible = true;
		const team = state.teams.find(
			/** Memilih ketua tim penerima pemberitahuan masalah akses. */
			function documentTeam(item) {
				return item.id === document.teamId;
			},
		);
		if (team)
			notify(
				state,
				team.leaderId,
				`Mentor belum dapat membuka ${document.title}`,
				"/peserta/karya",
			);
		audit(state, "Bahan tidak dapat diakses", document.id);
		return "Laporan terkirim kepada ketua tim.";
	}
	if (action !== "drive.save") throw new Error("Tindakan link tidak dikenali.");
	const team = actorTeam(state);
	if (actor.role !== "participant" || !team)
		throw new Error("Hanya anggota tim yang dapat mengelola link karya.");
	const url = new URL(safeUrl(textValue(payload, "url")));
	if (
		url.protocol !== "https:" ||
		!["drive.google.com", "docs.google.com"].includes(url.hostname)
	)
		throw new Error(
			"Gunakan link HTTPS Google Drive atau Google Docs yang lengkap.",
		);
	const title = requiredText(textValue(payload, "title"), "Judul link", 150);
	const id = typeof payload.id === "string" ? payload.id : "";
	if (id) {
		const current = state.documents.find(
			/** Membatasi perubahan pada link yang dimiliki tim aktif. */
			function ownLink(item) {
				return (
					item.id === id && item.teamId === team.id && item.kind === "drive"
				);
			},
		);
		if (!current) throw new Error("Link tidak ditemukan.");
		Object.assign(current, {
			title,
			url: url.toString(),
			updatedAt: new Date().toISOString(),
			inaccessible: false,
		});
	} else {
		state.documents.push({
			id: newId("drive"),
			teamId: team.id,
			title,
			url: url.toString(),
			kind: "drive",
			uploaderId: actor.id,
			updatedAt: new Date().toISOString(),
			inaccessible: false,
		});
	}
	audit(
		state,
		id ? "Link karya diperbarui" : "Link karya ditambahkan",
		team.id,
		title,
	);
	return "Link tersimpan. Pastikan izin berbagi Google Drive sudah diberikan kepada mentor.";
}
