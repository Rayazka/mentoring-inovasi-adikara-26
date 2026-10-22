// TODO: Validasi ulang tampilan login ketika aset resmi memperoleh izin publikasi.
"use client";
import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/app/auth/actions";
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
				</div>
			}
		/>
	);
}
