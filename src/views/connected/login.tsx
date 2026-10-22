// TODO: Validasi ulang tampilan login ketika aset resmi memperoleh izin publikasi.
"use client";
import { useRef, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInStaff, signInWithGoogle } from "@/app/auth/actions";
import { LoginLayout } from "@/views/components/login-layout";
import { ResourcePanel } from "@/views/components/ui";
import type { ResourceLink } from "@/models/demo/types";

/** Menonaktifkan pengiriman berulang saat autentikasi sedang diproses. */
function GoogleButton({ configured }: { configured: boolean }) {
	const { pending } = useFormStatus();
	return (
		<button
			className="login-provider-button"
			type="submit"
			disabled={!configured || pending}
		>
			{pending ? "Menghubungkan…" : "Masuk dengan Google"}
		</button>
	);
}

/** Menampilkan form staf dengan status pengiriman dan kegagalan tanpa menyimpan password. */
function StaffLogin({ configured }: { configured: boolean }) {
	const [state, action, pending] = useActionState(signInStaff, { error: null });
	return (
		<details className="staff-login">
			<summary>Masuk sebagai admin / mentor general</summary>
			<form action={action} className="stack">
				<label className="field" htmlFor="staff-email">
					Email staf
					<input
						id="staff-email"
						name="email"
						type="email"
						autoComplete="username"
						required
						maxLength={254}
					/>
				</label>
				<label className="field" htmlFor="staff-password">
					Password
					<input
						id="staff-password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						maxLength={1024}
					/>
				</label>
				<button
					className="login-provider-button"
					type="submit"
					disabled={!configured || pending}
				>
					{pending ? "Memeriksa…" : "Masuk sebagai staf"}
				</button>
				{state.error && (
					<p className="notice danger" role="alert">
						{state.error}
					</p>
				)}
			</form>
		</details>
	);
}

/** Menampilkan login nyata tanpa memuat akun atau penyimpanan fixtures. */
export function ConnectedLogin({
	configured,
	error,
	resources,
	dateLabel,
}: {
	configured: boolean;
	error?: string;
	resources: ResourceLink[];
	dateLabel: string;
}) {
	const section = useRef<HTMLDivElement>(null);
	/** Mengarahkan fokus ke tombol autentikasi pada kartu masuk. */
	function focusLogin() {
		section.current?.querySelector("button")?.focus();
		section.current?.scrollIntoView({ behavior: "smooth", block: "center" });
	}
	return (
		<LoginLayout
			dateLabel={dateLabel}
			onLogin={focusLogin}
			resources={<ResourcePanel links={resources} />}
			authentication={
				<div ref={section}>
					<form action={signInWithGoogle}>
						<GoogleButton configured={configured} />
					</form>
					<p className="login-method-note">
						Peserta masuk menggunakan akun Google.
					</p>
					{!configured && <p role="alert">Konfigurasi login belum tersedia.</p>}
					{error && (
						<p className="notice danger" role="alert">
							{error}
						</p>
					)}
					<hr className="login-card-divider" />
					<StaffLogin configured={configured} />
				</div>
			}
		/>
	);
}
