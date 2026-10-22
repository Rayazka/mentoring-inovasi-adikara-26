// TODO: Pertahankan file terpilih ketika unggahan gagal dan jangan tampilkan persentase progres rekaan.
"use client";
import {
	useRef,
	useState,
	useTransition,
	type FormEvent,
	type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { uploadParticipantFile } from "@/controllers/connected/upload-client";
import type { UploadGrant } from "@/models/connected/document";

/** Menampilkan form upload sesuai halaman karya dengan progres proses dan opsi retry file yang sama. */
export function DocumentUpload() {
	const [pending, startTransition] = useTransition();
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const attempt = useRef<UploadGrant | undefined>(undefined);
	const router = useRouter();
	/** Menghapus token percobaan sebelumnya ketika peserta memilih file yang berbeda. */
	function changed(_event: ChangeEvent<HTMLInputElement>) {
		attempt.current = undefined;
		setError("");
		setSuccess("");
	}
	/** Mengirim metadata ke controller dan menyerahkan unggahan langsung kepada adapter Storage. */
	function upload(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const input = new FormData(form);
		const file = input.get("file");
		if (!(file instanceof File) || !file.size) {
			setError("Pilih file terlebih dahulu.");
			return;
		}
		setError("");
		setSuccess("");
		startTransition(
			/** Mempertahankan file dan token percobaan ketika koneksi gagal di tengah proses. */
			async function send() {
				const result = await uploadParticipantFile(
					file,
					String(input.get("title") ?? ""),
					attempt.current,
				);
				attempt.current = result.grant;
				if (result.error) setError(result.error);
				else {
					setSuccess("File berhasil diunggah.");
					form.reset();
				}
				router.refresh();
			},
		);
	}
	return (
		<form className="stack" onSubmit={upload}>
			<p>
				PDF, DOCX, PPTX, PNG, atau JPEG. Maksimal 10 MB per file, 10 file dan
				total 50 MB per tim.
			</p>
			<fieldset
				disabled={pending}
				className="stack"
				style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
			>
				<label className="field">
					Judul bahan
					<input name="title" maxLength={150} required />
				</label>
				<label className="field">
					File
					<input
						name="file"
						type="file"
						required
						accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg"
						onChange={changed}
					/>
				</label>
				<button className="button" type="submit">
					{pending
						? "Mengunggah dan memverifikasi…"
						: error && attempt.current
							? "Coba unggah lagi"
							: "Unggah file"}
				</button>
			</fieldset>
			{pending && (
				<p role="status">
					Tunggu hingga verifikasi selesai sebelum menutup halaman.
				</p>
			)}
			{error && (
				<p className="notice danger" role="alert">
					{error}
				</p>
			)}
			{success && (
				<p className="notice" role="status">
					{success}
				</p>
			)}
		</form>
	);
}
