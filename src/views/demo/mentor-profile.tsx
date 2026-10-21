// TODO: Gunakan penyimpanan foto server saat mode produksi menggantikan data browser lokal.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { uploadMentorPhoto } from "@/controllers/demo/profile-controller";
import { mentorForUser } from "@/models/demo/mentor-policy";
import { Avatar, Button, EmptyState, Panel } from "@/views/components/ui";
import { registerDemoView } from "./registry";

/** Menampilkan profil mandiri yang hanya mengizinkan mentor mengubah foto dan title miliknya. */
export function MentorProfile({ controller }: { controller: DemoController }) {
	const { state, actor, dispatch } = controller;
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState(false);
	/** Memvalidasi foto dan menunggu penyimpanan tanpa menghapus input saat gagal. */
	async function upload(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		const file = new FormData(form).get("photo");
		if (!(file instanceof File)) return;
		setBusy(true);
		setError(false);
		try {
			setMessage(await uploadMentorPhoto(file));
			form.reset();
		} catch (cause) {
			setError(true);
			setMessage(
				cause instanceof Error ? cause.message : "Foto gagal diperbarui.",
			);
		} finally {
			setBusy(false);
		}
	}
	/** Menyimpan title profesional pada profil pemilik sesi. */
	function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		dispatch("profile.save", {
			title: new FormData(event.currentTarget).get("title"),
		});
	}
	/** Mengembalikan avatar profil menjadi inisial akun fiktif. */
	function removePhoto() {
		dispatch("profile.remove-photo");
	}
	if (!state || !actor) return null;
	const mentor = mentorForUser(state, actor.id);
	if (!mentor)
		return (
			<Panel>
				<EmptyState
					title="Profil mentor tidak tersedia"
					description="Hubungi admin untuk memeriksa penautan akun dan status profil."
					icon="mentor"
				/>
			</Panel>
		);
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">RUANG MENTOR</span>
					<h1>Profil Saya</h1>
					<p>Perbarui foto dan title yang tampil di katalog peserta.</p>
				</div>
			</div>
			<div className="grid-2">
				<Panel title="Foto profil">
					<div className="stack">
						<Avatar name={mentor.name} photo={mentor.photo} size="large" />
						<h2>{mentor.name}</h2>
						<form onSubmit={upload} className="stack">
							<label className="field">
								Foto baru
								<input
									type="file"
									name="photo"
									required
									accept="image/png,image/jpeg,image/webp"
								/>
							</label>
							<p className="helper">
								PNG, JPG atau WebP · maksimal 400 KB · tersimpan hanya di
								browser ini.
							</p>
							<div className="actions">
								<Button type="submit" disabled={busy}>
									{busy ? "Menyimpan…" : "Ganti foto"}
								</Button>
								<Button
									variant="neutral"
									onClick={removePhoto}
									disabled={!mentor.photo || busy}
								>
									Hapus foto
								</Button>
							</div>
						</form>
						{message && (
							<p
								className={`notice ${error ? "danger" : "success"}`}
								role={error ? "alert" : "status"}
							>
								{message}
							</p>
						)}
					</div>
				</Panel>
				<Panel title="Informasi profil">
					<form onSubmit={save} className="stack">
						<label className="field">
							Nama
							<input value={mentor.name} readOnly />
						</label>
						<label className="field">
							Bidang
							<input value={mentor.expertise} readOnly />
						</label>
						<label className="field">
							Title
							<input
								name="title"
								required
								maxLength={150}
								defaultValue={mentor.title}
							/>
						</label>
						<p className="helper">
							Perubahan nama, bidang, dan penautan akun dikelola oleh admin.
						</p>
						<Button type="submit">Simpan title</Button>
					</form>
				</Panel>
			</div>
		</>
	);
}
registerDemoView("/mentor/profil", MentorProfile);
