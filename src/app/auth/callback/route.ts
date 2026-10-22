// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { NextResponse, type NextRequest } from "next/server";
import { completeGoogleLogin } from "@/controllers/auth/google-login";
import { hasAppUrl, getAppUrl } from "@/lib/supabase/env";

/** Menukar kode callback menjadi sesi dan mengarahkan pengguna ke dashboard. */
export async function GET(request: NextRequest) {
	const destination = await completeGoogleLogin(
		request.nextUrl.searchParams.get("code"),
	);
	const origin = hasAppUrl() ? getAppUrl() : request.nextUrl.origin;
	return NextResponse.redirect(new URL(destination, origin));
}
