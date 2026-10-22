// TODO: Selaraskan jenis dan batas file dengan kebijakan bucket serta validasi database.
import { z } from "zod";
export const documentMime = {
	"application/pdf": ".pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		".docx",
	"application/vnd.openxmlformats-officedocument.presentationml.presentation":
		".pptx",
	"image/png": ".png",
	"image/jpeg": ".jpg",
} as const;
export const uploadInput = z
	.object({
		title: z.string().trim().min(1).max(150),
		filename: z.string().min(1).max(200),
		bytes: z.number().int().min(1).max(10485760),
		mime: z.enum(
			Object.keys(documentMime) as [
				keyof typeof documentMime,
				...(keyof typeof documentMime)[],
			],
		),
	})
	.refine(
		/** Menolak ketidaksesuaian ekstensi sebelum server membuat izin unggah sementara. */
		function extensionMatches(input) {
			const name = input.filename.toLowerCase();
			return (
				name.endsWith(documentMime[input.mime]) ||
				(input.mime === "image/jpeg" && name.endsWith(".jpeg"))
			);
		},
	);
export interface TeamDocument {
	id: string;
	team_id: string;
	title: string;
	kind: "file" | "drive";
	drive_url: string | null;
	filename: string | null;
	bytes: number | null;
	ready: boolean;
	inaccessible: boolean;
	uploaded_by: string;
}
export interface UploadGrant {
	id: string;
	path: string;
	token: string;
}

export const driveInput = z.object({
	document: z.union([z.uuid(), z.literal("")]).default(""),
	title: z.string().trim().min(1).max(150),
	url: z
		.url()
		.refine(
			/** Membatasi tautan pada Google Drive dan Google Docs melalui HTTPS tanpa kredensial. */
			function googleDriveOnly(value) {
				try {
					const url = new URL(value);
					return (
						url.protocol === "https:" &&
						["drive.google.com", "docs.google.com"].includes(url.hostname) &&
						!url.username &&
						!url.password &&
						!url.port &&
						url.pathname !== "/" &&
						!/\s/.test(value)
					);
				} catch {
					return false;
				}
			},
		)
		.transform(
			/** Menormalkan hostname URL sebelum dibandingkan dengan constraint database. */
			function normalizedDriveUrl(value) {
				return new URL(value).toString();
			},
		),
});

/** Memeriksa penanda format dasar selain MIME yang dilaporkan browser. */
export function hasFileSignature(bytes: Uint8Array, mime: string) {
	if (mime === "application/pdf")
		return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
	if (mime === "image/png")
		return [137, 80, 78, 71, 13, 10, 26, 10].every(
			/** Mencocokkan seluruh byte magic PNG. */
			function png(value, index) {
				return bytes[index] === value;
			},
		);
	if (mime === "image/jpeg")
		return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
	return (
		mime in documentMime &&
		bytes[0] === 80 &&
		bytes[1] === 75 &&
		bytes[2] === 3 &&
		bytes[3] === 4
	);
}
