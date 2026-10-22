// TODO: Tambahkan pembersihan berkala reservasi unggahan yang ditinggalkan setelah token kedaluwarsa.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { createStorageAdmin } from "@/lib/supabase/storage-admin";
import { readParticipantTeam } from "@/models/connected/team-repository";
import {
	uploadInput,
	hasFileSignature,
	type UploadGrant,
} from "@/models/connected/document";
import {
	teamMutationError,
	type MutationResult,
} from "@/models/connected/team";

/** Mereservasi kuota melalui sesi peserta sebelum menerbitkan token untuk satu object path. */
export async function prepareParticipantUpload(
	input: unknown,
): Promise<{ error: string | null; grant?: UploadGrant }> {
	const { supabase, user } = await requireSession(["participant"]);
	const parsed = uploadInput.safeParse(input);
	if (!parsed.success)
		return {
			error:
				"Gunakan PDF, DOCX, PPTX, PNG, atau JPEG dengan ekstensi sesuai dan ukuran maksimal 10 MB.",
		};
	let reservation: { id: string; object_path: string; title: string } | null =
		null;
	try {
		const admin = createStorageAdmin();
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { error: "Bentuk tim terlebih dahulu." };
		const { data, error } = await supabase.rpc("reserve_document", {
			p_team: team.id,
			p_title: parsed.data.title,
			p_kind: "file",
			p_filename: parsed.data.filename,
			p_bytes: parsed.data.bytes,
			p_mime: parsed.data.mime,
		});
		if (error || !data)
			return {
				error:
					error?.message === "Kuota file tim maksimal 10 berkas dan 50 MB."
						? error.message
						: teamMutationError(),
			};
		reservation = Array.isArray(data) ? data[0] : data;
		if (!reservation?.id || !reservation.object_path.startsWith(`${team.id}/`))
			throw new Error("Reservasi tidak valid.");
		const signed = await admin.storage
			.from("team-documents")
			.createSignedUploadUrl(reservation.object_path, { upsert: false });
		if (signed.error || !signed.data)
			throw new Error("Token unggah gagal dibuat.");
		return {
			error: null,
			grant: {
				id: reservation.id,
				path: reservation.object_path,
				token: signed.data.token,
			},
		};
	} catch {
		if (reservation)
			await supabase.rpc("update_document", {
				p_document: reservation.id,
				p_title: reservation.title,
				p_delete: true,
			});
		return {
			error:
				"Izin unggah belum dapat dibuat. Periksa konfigurasi penyimpanan dan coba lagi.",
		};
	}
}

/** Memvalidasi objek aktual dan kepemilikan sebelum menandai unggahan siap untuk dibaca mentor. */
export async function finishParticipantUpload(
	id: string,
): Promise<MutationResult> {
	const { supabase, user } = await requireSession(["participant"]);
	if (!z.uuid().safeParse(id).success)
		return { error: "Identitas unggahan tidak valid." };
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { error: "Keanggotaan tim tidak tersedia." };
		const { data: document, error } = await supabase
			.from("documents")
			.select("id,object_path,bytes,mime_type,ready")
			.eq("id", id)
			.eq("team_id", team.id)
			.eq("uploaded_by", user.id)
			.eq("kind", "file")
			.is("deleted_at", null)
			.maybeSingle();
		if (error || !document)
			return { error: "Unggahan tidak tersedia untuk akun ini." };
		if (document.ready)
			return { error: null, success: "File sudah tersimpan." };
		if (
			!document.object_path?.startsWith(`${team.id}/`) ||
			document.bytes < 1 ||
			document.bytes > 10485760
		)
			return { error: "Reservasi file tidak valid." };
		const admin = createStorageAdmin();
		const object = await admin.storage
			.from("team-documents")
			.download(document.object_path);
		if (object.error || !object.data)
			return {
				error:
					"File belum diterima Storage. Coba unggah ulang atau batalkan reservasi.",
			};
		if (
			object.data.size !== document.bytes ||
			!hasFileSignature(
				new Uint8Array(await object.data.slice(0, 8).arrayBuffer()),
				document.mime_type,
			)
		) {
			await admin.storage.from("team-documents").remove([document.object_path]);
			return {
				error:
					"Isi atau ukuran file tidak sesuai. Pilih file yang benar lalu coba lagi.",
			};
		}
		const completed = await admin.rpc("complete_document_upload", {
			p_document: id,
		});
		if (completed.error)
			return {
				error: "Verifikasi unggahan belum selesai. Coba verifikasi kembali.",
			};
	} catch {
		return { error: "Verifikasi file gagal. Periksa koneksi lalu coba lagi." };
	}
	revalidatePath("/peserta", "layout");
	return { error: null, success: "File berhasil diunggah dan siap digunakan." };
}
