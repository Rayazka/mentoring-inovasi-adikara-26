// TODO: Pindahkan unggahan foto ke Storage privat saat akun mentor produksi diaktifkan.
import type { DemoState } from "@/models/demo/types";
import { mentorForUser } from "@/models/demo/mentor-policy";
import { audit, requireActor, requiredText } from "./context";
import { textValue, type CommandPayload } from "./session-controller";
import { executeDemoCommand } from "./use-demo-controller";
import { getDemoSnapshot } from "@/models/demo/repository";

/** Mengubah title dan foto hanya pada profil yang terhubung dengan akun mentor aktif. */
export function profileCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	const actor = requireActor(state);
	const mentor = mentorForUser(state, actor.id);
	if (!mentor)
		throw new Error("Akunmu tidak terhubung dengan profil mentor aktif.");
	if (action === "profile.save")
		mentor.title = requiredText(textValue(payload, "title"), "Title", 150);
	else if (action === "profile.photo") {
		const photo = textValue(payload, "photo");
		if (
			photo.length > 600000 ||
			!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(photo)
		)
			throw new Error("Gunakan foto PNG, JPG atau WebP maksimal 400 KB.");
		mentor.photo = photo;
	} else if (action === "profile.remove-photo") delete mentor.photo;
	else throw new Error("Tindakan profil tidak dikenali.");
	audit(state, "Profil mentor diperbarui", mentor.id);
	return "Profil mentor berhasil diperbarui.";
}

/** Membaca foto dengan batas ukuran sebelum menyimpan, tanpa mengubah foto lama saat proses gagal. */
export async function uploadMentorPhoto(file: File) {
	const state = getDemoSnapshot();
	const originalUser = state?.userId;
	if (!state || !originalUser || !mentorForUser(state, originalUser))
		throw new Error("Sesi mentor tidak tersedia.");
	if (
		!["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
		file.size <= 0 ||
		file.size > 400 * 1024
	)
		throw new Error("Pilih PNG, JPG atau WebP maksimal 400 KB.");
	const bitmap = await createImageBitmap(file);
	bitmap.close();
	const photo = await new Promise<string>(
		/** Membaca foto valid menjadi data lokal tanpa mengunggahnya ke pihak ketiga. */
		function readPhoto(resolve, reject) {
			const reader = new FileReader();
			/** Mengembalikan foto setelah seluruh data selesai dibaca. */
			reader.onload = function loadedPhoto() {
				resolve(String(reader.result));
			};
			/** Menjelaskan kegagalan baca tanpa menimpa foto sebelumnya. */
			reader.onerror = function failedPhoto() {
				reject(
					new Error(
						"Foto tidak dapat dibaca. Foto sebelumnya tetap tersimpan.",
					),
				);
			};
			reader.readAsDataURL(file);
		},
	);
	if (getDemoSnapshot()?.userId !== originalUser)
		throw new Error("Sesi berubah. Silakan ulangi unggahan foto.");
	return executeDemoCommand("profile.photo", { photo });
}
