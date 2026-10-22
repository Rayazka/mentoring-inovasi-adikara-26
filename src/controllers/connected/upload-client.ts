// TODO: Tambahkan pemulihan lintas tab tanpa menyimpan token upload pada localStorage.
import { createClient } from "@/lib/supabase/client";
import {
	prepareParticipantUpload,
	finishParticipantUpload,
} from "./upload-actions";
import type { UploadGrant } from "@/models/connected/document";

/** Mengunggah langsung ke Storage memakai token satu objek, lalu meminta verifikasi server. */
export async function uploadParticipantFile(
	file: File,
	title: string,
	previous?: UploadGrant,
) {
	let grant = previous;
	try {
		if (!grant) {
			const prepared = await prepareParticipantUpload({
				title,
				filename: file.name,
				bytes: file.size,
				mime: file.type,
			});
			if (prepared.error || !prepared.grant)
				return { error: prepared.error ?? "Reservasi unggahan gagal." };
			grant = prepared.grant;
		}
		const uploaded = await createClient()
			.storage.from("team-documents")
			.uploadToSignedUrl(grant.path, grant.token, file, {
				contentType: file.type,
			});
		const completed = await finishParticipantUpload(grant.id);
		if (!completed.error) return { ...completed, grant: undefined };
		return {
			error: uploaded.error
				? "Unggahan belum selesai. Coba lagi menggunakan file yang sama atau batalkan reservasi pada daftar bahan."
				: completed.error,
			grant,
		};
	} catch {
		return {
			error:
				"Koneksi terputus. Coba lagi atau periksa reservasi pada daftar bahan sebelum membuat unggahan baru.",
			grant,
		};
	}
}
