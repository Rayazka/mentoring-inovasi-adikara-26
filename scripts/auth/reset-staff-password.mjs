// TODO: Tinjau kebijakan akun staf sebelum memperluas alat administrasi lokal ini.
import { createClient } from "@supabase/supabase-js";
import nextEnv from "@next/env";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";

/** Memvalidasi input tanpa menyertakan nilai password dalam pesan kesalahan. */
export function validateInput(input) {
	if (
		!input ||
		typeof input.email !== "string" ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
	) {
		throw new Error("Email akun staf tidak valid.");
	}
	if (
		typeof input.password !== "string" ||
		input.password.length < 8 ||
		input.password.length > 1024
	) {
		throw new Error("Password harus berisi 8–1024 karakter.");
	}
	return { email: input.email.trim().toLowerCase(), password: input.password };
}

/** Menemukan akun staf aktif tanpa mengubah identitas, peran, atau data akun. */
export async function findStaffAccount(client, email) {
	for (let page = 1; page <= 100; page += 1) {
		const { data, error } = await client.auth.admin.listUsers({
			page,
			perPage: 200,
		});
		if (error)
			throw new Error(
				"Tidak dapat membaca akun. Periksa secret key dan project Supabase.",
			);
		const user = data.users.find(
			/** Membandingkan hanya email yang dipilih pengguna terminal. */
			function selectedAccount(account) {
				return account.email?.toLowerCase() === email.toLowerCase();
			},
		);
		if (user) {
			const result = await client
				.from("profiles")
				.select("role,is_active")
				.eq("id", user.id)
				.single();
			if (
				result.error ||
				!result.data?.is_active ||
				!["admin", "mentor_general"].includes(result.data.role)
			) {
				throw new Error(
					"Akun bukan staf aktif. Periksa role dan is_active pada profiles; alat ini tidak mengubah peran.",
				);
			}
			return {
				id: user.id,
				confirmed: Boolean(user.email_confirmed_at),
				role: result.data.role,
			};
		}
		if (data.users.length < 200) break;
	}
	throw new Error(
		"Akun belum ditemukan pada project Supabase yang dikonfigurasi.",
	);
}

/** Membaca konfigurasi server saja tanpa mencetak atau mempersistenkan kredensial. */
function createAdminClient() {
	nextEnv.loadEnvConfig(fileURLToPath(new URL("../../", import.meta.url)));
	const secret = process.env.SUPABASE_SECRET_KEY;
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	if (!secret?.startsWith("sb_secret_") || !url)
		throw new Error("Isi SUPABASE_SECRET_KEY dan URL project di .env.local.");
	const address = new URL(url);
	if (address.protocol !== "https:" || address.pathname !== "/")
		throw new Error("URL project Supabase harus berupa root HTTPS.");
	return createClient(url, secret, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});
}

/** Menjalankan pemeriksaan akun atau reset yang diminta langsung oleh pengguna terminal. */
async function main() {
	const client = createAdminClient();
	if (process.argv[2] === "--check") {
		const email = process.argv[3];
		if (!email) throw new Error("Masukkan email untuk pemeriksaan akun.");
		const account = await findStaffAccount(client, email);
		console.log(
			`Akun ditemukan: role=${account.role}; email terkonfirmasi=${account.confirmed}. Tidak ada perubahan.`,
		);
		return;
	}
	if (process.argv[2] !== "--reset")
		throw new Error(
			"Jalankan reset melalui scripts/auth/reset-staff-password.ps1.",
		);
	process.stdin.setEncoding("utf8");
	let payload = "";
	for await (const chunk of process.stdin) {
		payload += chunk;
		if (payload.length > 8192) throw new Error("Input terlalu panjang.");
	}
	let input;
	try {
		input = validateInput(JSON.parse(payload));
	} catch {
		throw new Error(
			"Input tidak valid. Gunakan email staf dan password sepanjang 8–1024 karakter.",
		);
	}
	payload = "";
	const account = await findStaffAccount(client, input.email);
	const { error } = await client.auth.admin.updateUserById(account.id, {
		password: input.password,
	});
	input.password = "";
	if (error)
		throw new Error(
			"Reset gagal. Periksa kebijakan password Supabase dan koneksi; password tidak ditampilkan.",
		);
	console.log(
		`Password berhasil diganti untuk akun ${account.role}. ID dan peran tetap sama.`,
	);
	if (!account.confirmed)
		console.log(
			"Email akun belum terkonfirmasi; selesaikan konfirmasi email sebelum login.",
		);
}

if (
	process.argv[1] &&
	import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
	main().catch(
		/** Menyembunyikan rincian provider, token, dan input saat operasi gagal. */
		function reportFailure() {
			console.error(
				"Operasi gagal. Periksa keberadaan akun staf aktif, secret key, koneksi dan kebijakan password Supabase. Tidak ada kredensial yang dicatat.",
			);
			process.exitCode = 1;
		},
	);
}
