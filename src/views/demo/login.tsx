// TODO: Hubungkan Google setelah integrasi produksi siap tanpa mengubah struktur frame M2j3WV.
"use client";
import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoginLayout } from "@/views/components/login-layout";
import { useDemoController } from "@/controllers/demo/use-demo-controller";
import { roleHome } from "@/lib/auth/roles";
import { Button, Icon, Modal, ResourcePanel } from "@/views/components/ui";
import "@/views/styles/login.css";

/** Menyajikan halaman login sesuai HTML frame M2j3WV dengan autentikasi demo yang terpisah. */
export function DemoLogin() {
	const { state, actor, dispatch, feedback } = useDemoController();
	const [open, setOpen] = useState(false);
	const [userId, setUserId] = useState("alya");
	const router = useRouter();
	/** Membuka pilihan akun contoh tanpa menghubungi layanan Google. */
	function openLogin() {
		setOpen(true);
	}
	/** Menutup pilihan akun dan mengembalikan fokus ke tombol masuk. */
	function closeLogin() {
		setOpen(false);
	}
	/** Mengubah akun contoh yang akan digunakan untuk mencoba aplikasi. */
	function selectAccount(event: ChangeEvent<HTMLSelectElement>) {
		setUserId(event.target.value);
	}
	/** Memulai sesi lokal yang sah lalu mengarahkan pengguna sesuai perannya. */
	function login(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const selected = state?.users.find(
			/** Mencari akun yang dipilih dari data demo yang sudah dimuat. */
			function selectedUser(user) {
				return user.id === userId;
			},
		);
		if (selected && dispatch("session.login", { userId })) {
			closeLogin();
			router.push(roleHome(selected.role));
		}
	}
	const dates = state?.settings.dates ?? ["2026-10-24", "2026-10-25"];
	const start = dates[0];
	const end = dates[dates.length - 1];
	const dateLabel =
		start && end
			? `${Number(start.slice(8))}${start !== end ? `–${Number(end.slice(8))}` : ""} ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" }).format(new Date(`${end}T12:00:00+07:00`))}`
			: "Tanggal mentoring akan diumumkan";
	return (
		<LoginLayout
			dateLabel={dateLabel}
			onLogin={openLogin}
			showIcon
			authentication={
				<>
					<button
						type="button"
						className="login-provider-button"
						onClick={openLogin}
					>
						<Icon name="logout" />
						<span>Masuk ke demo</span>
					</button>
					<p className="login-method-note">
						Mode demo · Login Google belum terhubung.
					</p>
					<hr className="login-card-divider" />
					{actor && (
						<Link className="login-resume" href={roleHome(actor.role)}>
							Lanjutkan sebagai {actor.name}
							<Icon name="arrow" />
						</Link>
					)}
				</>
			}
			resources={
				state ? (
					<ResourcePanel links={state.resources} />
				) : (
					<p role="status">Memuat link penting…</p>
				)
			}
		>
			<Modal open={open} title="Masuk demo ADIKARA" onClose={closeLogin}>
				<form className="stack" onSubmit={login}>
					<p className="notice">
						Google belum terhubung. Pilih akun fiktif untuk mencoba alur
						peserta, mentor, atau admin. Data demo tersimpan pada browser ini.
					</p>
					<label htmlFor="akun-demo-login" className="field">
						Akun demo
					</label>
					<select
						id="akun-demo-login"
						className="login-account-select"
						value={userId}
						onChange={selectAccount}
						disabled={!state}
					>
						{state?.users
							.filter(
								/** Membatasi pemilih pada peserta, admin dan akun mentor yang profilnya masih aktif. */
								function availableAccount(user) {
									return (
										user.role !== "mentor" ||
										state.mentors.some(
											/** Memastikan akun mentor yang ditawarkan masih terhubung dengan profil aktif. */
											function activeMentor(mentor) {
												return (
													mentor.userId === user.id &&
													mentor.active &&
													!mentor.archived
												);
											},
										)
									);
								},
							)
							.map(
								/** Menjelaskan nama dan peran setiap akun contoh sebelum sesi dimulai. */
								function accountOption(user) {
									return (
										<option key={user.id} value={user.id}>
											{user.name} —{" "}
											{user.role === "participant"
												? "Peserta"
												: user.role === "mentor"
													? "Mentor"
													: "Admin"}
										</option>
									);
								},
							)}
					</select>
					{feedback?.error && (
						<p className="notice danger" role="alert">
							{feedback.message}
						</p>
					)}
					<div className="actions">
						<Button variant="neutral" onClick={closeLogin}>
							Batal
						</Button>
						<Button type="submit" disabled={!state}>
							Masuk ke demo
						</Button>
					</div>
				</form>
			</Modal>
		</LoginLayout>
	);
}
