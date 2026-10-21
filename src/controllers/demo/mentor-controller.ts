// TODO: Pindahkan operasi admin dan audit mentor ke endpoint server saat adapter produksi tersedia.
import type { DemoState, Mentor } from "@/models/demo/types";
import { mentorHasActivity } from "@/models/demo/mentor-policy";
import { audit, newId, requireAdmin, requiredText } from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Mengelola profil mentor independen dari akun dengan arsip aman dan riwayat yang tetap utuh. */
export function mentorCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	requireAdmin(state);
	const id = typeof payload.id === "string" ? payload.id : "";
	const mentor = state.mentors.find(
		/** Mengambil profil target administrasi dengan identitas tetap. */
		function targetMentor(item) {
			return item.id === id;
		},
	);
	if (action === "mentor.save") {
		const name = requiredText(textValue(payload, "name"), "Nama mentor", 100);
		const title = requiredText(
			textValue(payload, "title"),
			"Title mentor",
			150,
		);
		const expertise = requiredText(
			textValue(payload, "expertise"),
			"Bidang mentor",
			50,
		);
		const bio = requiredText(textValue(payload, "bio"), "Biografi", 3000);
		const achievements = textValue(payload, "achievements")
			.split("\n")
			.map(
				/** Membersihkan spasi pada setiap baris pencapaian. */
				function cleanAchievement(line) {
					return line.trim();
				},
			)
			.filter(Boolean);
		if (achievements.join("\n").length > 5000)
			throw new Error("Pencapaian maksimal 5.000 karakter.");
		if (id && (!mentor || mentor.archived))
			throw new Error("Mentor tidak ditemukan atau telah diarsipkan.");
		if (mentor)
			Object.assign(mentor, { name, title, expertise, bio, achievements });
		else {
			const created: Mentor = {
				id: newId("mentor"),
				name,
				title,
				expertise,
				bio,
				achievements,
				active: true,
				archived: false,
				dates: [...state.settings.dates],
			};
			state.mentors.push(created);
		}
		audit(
			state,
			mentor ? "Mentor diperbarui" : "Mentor ditambahkan",
			mentor?.id ?? state.mentors[state.mentors.length - 1].id,
			name,
		);
		return mentor
			? "Profil mentor diperbarui."
			: "Mentor dibuat. Atur jadwal dan tautkan akun melalui admin.";
	}
	if (!mentor) throw new Error("Mentor tidak ditemukan.");
	if (action === "mentor.status" || action === "mentor.archive") {
		if (mentor.archived) throw new Error("Mentor sudah diarsipkan.");
		const deactivate = action === "mentor.archive" || !payload.active;
		if (deactivate && mentorHasActivity(state, mentor.id))
			throw new Error(
				"Mentor masih memiliki pengajuan atau sesi aktif. Selesaikan atau batalkan melalui operasional terlebih dahulu.",
			);
		mentor.active = !deactivate;
		if (action === "mentor.archive") mentor.archived = true;
		audit(
			state,
			mentor.archived
				? "Mentor diarsipkan"
				: mentor.active
					? "Mentor diaktifkan"
					: "Mentor dinonaktifkan",
			mentor.id,
		);
		return mentor.archived
			? "Mentor diarsipkan. Riwayat tetap tersimpan."
			: "Status mentor diperbarui.";
	}
	throw new Error("Tindakan mentor tidak dikenali.");
}
