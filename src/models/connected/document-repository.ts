// TODO: Tambahkan retensi objek terhapus dan pembersihan reservasi kedaluwarsa melalui pekerjaan operasional.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TeamDocument } from "./document";

/** Membaca daftar bahan tim tanpa mengirim object path atau token Storage ke halaman daftar. */
export async function readWorkDocuments(
	client: SupabaseClient,
	teamId: string,
): Promise<TeamDocument[]> {
	const { data, error } = await client
		.from("documents")
		.select(
			"id,team_id,title,kind,drive_url,filename,bytes,ready,inaccessible,uploaded_by",
		)
		.eq("team_id", teamId)
		.is("deleted_at", null)
		.order("created_at", { ascending: false });
	if (error) throw new Error("Bahan karya gagal dibaca.");
	return data ?? [];
}
