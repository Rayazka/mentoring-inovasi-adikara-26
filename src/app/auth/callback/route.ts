// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig, getAppUrl } from "@/lib/supabase/env";

/** Menukar kode callback menjadi sesi dan mengarahkan pengguna ke dashboard. */
export async function GET(request: NextRequest) {
	const appUrl = getAppUrl();
	if (!appUrl || !hasSupabaseConfig()) {
		return NextResponse.redirect(new URL("/?auth=unconfigured", request.url));
	}

	const code = request.nextUrl.searchParams.get("code");
	if (code) {
		const supabase = await createClient();
		const { error } = await supabase.auth.exchangeCodeForSession(code);
		if (!error) return NextResponse.redirect(new URL("/dashboard", appUrl));
	}
	return NextResponse.redirect(new URL("/?auth=failed", appUrl));
}
