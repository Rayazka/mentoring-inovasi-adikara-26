// TODO: Uji URL unduhan kedaluwarsa dan pencabutan keanggotaan pada deployment staging.
import "server-only";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";

/** Membuat URL unduh singkat hanya setelah metadata dan objek lolos RLS sesi peminta. */
export async function authorizeDocumentDownload(
	id: string,
): Promise<string | null> {
	const { supabase } = await requireSession([
		"participant",
		"mentor_general",
		"admin",
	]);
	if (!z.uuid().safeParse(id).success) return null;
	try {
		const { data, error } = await supabase
			.from("documents")
			.select("object_path,filename")
			.eq("id", id)
			.eq("kind", "file")
			.eq("ready", true)
			.is("deleted_at", null)
			.maybeSingle();
		if (error || !data?.object_path) return null;
		const result = await supabase.storage
			.from("team-documents")
			.createSignedUrl(data.object_path, 60, {
				download: data.filename ?? true,
			});
		if (result.error || !result.data?.signedUrl) return null;
		return result.data.signedUrl;
	} catch {
		return null;
	}
}
