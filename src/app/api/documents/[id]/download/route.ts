// TODO: Pertahankan respons privat tanpa cache dan batas masa berlaku URL hasil otorisasi.
import { NextResponse } from "next/server";
import { authorizeDocumentDownload } from "@/controllers/connected/document-download";

/** Mengadaptasi unduhan berizin tanpa menerima bucket atau object path dari browser. */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const url = await authorizeDocumentDownload(id);
	if (!url)
		return new Response("Dokumen tidak tersedia atau akses tidak diizinkan.", {
			status: 404,
			headers: { "Cache-Control": "private, no-store" },
		});
	const response = NextResponse.redirect(url, 303);
	response.headers.set("Cache-Control", "private, no-store");
	response.headers.set("Referrer-Policy", "no-referrer");
	return response;
}
