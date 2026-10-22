// TODO: Pertahankan riwayat metadata saat bahan dihapus dan terapkan retensi objek terpisah.
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { readParticipantTeam } from "@/models/connected/team-repository";
import {
	teamMutationError,
	type MutationResult,
} from "@/models/connected/team";
import { driveInput } from "@/models/connected/document";

/** Mencabut akses dokumen melalui soft delete setelah memeriksa pengunggah atau ketua tim. */
export async function deleteParticipantDocument(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase, user } = await requireSession(["participant"]);
	const input = z
		.object({ document: z.uuid(), confirmation: z.literal("HAPUS") })
		.safeParse(Object.fromEntries(form));
	if (!input.success)
		return { error: "Ketik HAPUS untuk mengonfirmasi penghapusan." };
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { error: "Keanggotaan tim tidak tersedia." };
		const { data, error } = await supabase
			.from("documents")
			.select("title,drive_url,uploaded_by")
			.eq("id", input.data.document)
			.eq("team_id", team.id)
			.is("deleted_at", null)
			.maybeSingle();
		if (
			error ||
			!data ||
			(team.leader_id !== user.id && data.uploaded_by !== user.id)
		)
			return {
				error:
					"Hanya pengunggah atau ketua tim yang dapat menghapus bahan ini.",
			};
		const result = await supabase.rpc("update_document", {
			p_document: input.data.document,
			p_title: data.title,
			p_url: data.drive_url,
			p_delete: true,
		});
		if (result.error)
			return {
				error: teamMutationError(result.error.code, result.error.message),
			};
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success:
			"Bahan dihapus dari daftar aktif. Riwayat pengajuan tetap disimpan.",
	};
}

/** Menambah atau memperbaiki link Drive milik tim tanpa mengklaim pemberian izin Google otomatis. */
export async function saveParticipantDrive(
	_previous: MutationResult,
	form: FormData,
): Promise<MutationResult> {
	const { supabase, user } = await requireSession(["participant"]);
	const input = driveInput.safeParse(Object.fromEntries(form));
	if (!input.success)
		return {
			error:
				"Isi judul dan tautan HTTPS dari drive.google.com atau docs.google.com yang valid.",
		};
	try {
		const team = await readParticipantTeam(supabase, user.id);
		if (!team) return { error: "Bentuk tim terlebih dahulu." };
		if (input.data.document) {
			const { data, error } = await supabase
				.from("documents")
				.select("uploaded_by")
				.eq("id", input.data.document)
				.eq("team_id", team.id)
				.eq("kind", "drive")
				.is("deleted_at", null)
				.maybeSingle();
			if (
				error ||
				!data ||
				(data.uploaded_by !== user.id && team.leader_id !== user.id)
			)
				return {
					error: "Hanya pengunggah atau ketua yang dapat memperbarui link ini.",
				};
			const result = await supabase.rpc("update_document", {
				p_document: input.data.document,
				p_title: input.data.title,
				p_url: input.data.url,
			});
			if (result.error)
				return {
					error: teamMutationError(result.error.code, result.error.message),
				};
		} else {
			const { error } = await supabase.rpc("reserve_document", {
				p_team: team.id,
				p_title: input.data.title,
				p_kind: "drive",
				p_url: input.data.url,
			});
			if (error) return { error: teamMutationError(error.code, error.message) };
		}
	} catch {
		return { error: teamMutationError() };
	}
	revalidatePath("/peserta", "layout");
	return {
		error: null,
		success:
			"Link tersimpan. Pastikan izin berbagi Google Drive sudah diberikan kepada mentor.",
	};
}
