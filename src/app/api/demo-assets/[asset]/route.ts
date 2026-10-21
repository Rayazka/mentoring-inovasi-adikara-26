// TODO: Konfigurasikan distribusi aset resmi hanya setelah pemilik mengizinkan publikasinya.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isDemoMode } from "@/models/demo/mode";

export const runtime = "nodejs";
const assets: Record<string, { path: string; type: string }> = {
	"login-logo": {
		path: "docs/login-reference-assets/adf15c94ae4792ad.webp",
		type: "image/webp",
	},
	"login-icon": {
		path: "docs/login-reference-assets/222a4e4582895d7a.png",
		type: "image/png",
	},
	"login-pattern": {
		path: "docs/login-reference-assets/de17b5cc701bbedc.png",
		type: "image/png",
	},
	"login-footer-pattern": {
		path: "docs/login-reference-assets/ca49549b647dfa59.png",
		type: "image/png",
	},
	"login-ornament": {
		path: "docs/login-reference-assets/ornament.svg",
		type: "image/svg+xml",
	},
	"login-blur-ornament": {
		path: "docs/login-reference-assets/blur-ornament.svg",
		type: "image/svg+xml",
	},
	logo: { path: "assets/adikara-logo.webp", type: "image/webp" },
	icon: { path: "assets/adikara-icon.svg", type: "image/svg+xml" },
	resource: {
		path: "docs/design-assets/7c319e27b37b278a.webp",
		type: "image/webp",
	},
	pattern: {
		path: "docs/design-assets/00556c372b555bf4.png",
		type: "image/png",
	},
	font: {
		path: "docs/fonts/adikara.helloprodigi.pro/100611c878e97c31.woff2",
		type: "font/woff2",
	},
	informatics: { path: "assets/informatics-logo.svg", type: "image/svg+xml" },
	prodigi: { path: "assets/prodigi-logo.webp", type: "image/webp" },
};

/** Menyajikan hanya aset brand yang diizinkan untuk pratinjau lokal tanpa menyalinnya ke repo publik. */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ asset: string }> },
) {
	if (process.env.NODE_ENV !== "development" || !isDemoMode())
		return new Response(null, { status: 404 });
	const { asset } = await params;
	const entry = assets[asset];
	if (!entry) return new Response(null, { status: 404 });
	try {
		// Aset privat hanya dibaca saat pengembangan dan tidak dimasukkan ke bundel produksi.
		const data = await readFile(
			join(/* turbopackIgnore: true */ process.cwd(), entry.path),
		);
		return new Response(new Uint8Array(data), {
			headers: {
				"Content-Type": entry.type,
				"Cache-Control": "private, max-age=3600",
				"X-Content-Type-Options": "nosniff",
			},
		});
	} catch {
		return new Response(null, { status: 404 });
	}
}
