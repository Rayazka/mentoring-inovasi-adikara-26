// TODO: Gunakan tipe database generated untuk kontrak karya ketika skema dibakukan.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkRecord } from "./work";

/** Membaca identitas karya tim dengan client sesi agar RLS tetap berlaku. */
export async function readTeamWork(
	client: SupabaseClient,
	teamId: string,
): Promise<WorkRecord | null> {
	const { data, error } = await client
		.from("works")
		.select("team_id,title,description,is_draft,updated_at,updated_by")
		.eq("team_id", teamId)
		.maybeSingle();
	if (error) throw new Error("Identitas karya gagal dibaca.");
	return data;
}
