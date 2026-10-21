// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import type {
	DemoState,
	DemoUser,
	MentoringRequest,
	Team,
} from "@/models/demo/types";

/** Mengambil akun demo aktif atau menolak tindakan tanpa sesi. */
export function requireActor(state: DemoState): DemoUser {
	const actor = state.users.find(
		/** Menjalankan langkah matchingAccount sesuai tanggung jawab modul ini. */
		function matchingAccount(user) {
			return user.id === state.userId;
		},
	);
	if (!actor) throw new Error("Masuk ke akun demo terlebih dahulu.");
	return actor;
}

/** Mengambil tim aktif pengguna tanpa membuka data privat tim lain. */
export function actorTeam(
	state: DemoState,
	actor = requireActor(state),
): Team | undefined {
	return state.teams.find(
		/** Menjalankan langkah membership sesuai tanggung jawab modul ini. */
		function membership(team) {
			return team.memberIds.includes(actor.id);
		},
	);
}

/** Memastikan hanya ketua tim terkait yang menjalankan tindakan ini. */
export function requireLeader(state: DemoState, teamId: string): Team {
	const actor = requireActor(state);
	const team = state.teams.find(
		/** Menjalankan langkah matchingTeam sesuai tanggung jawab modul ini. */
		function matchingTeam(value) {
			return value.id === teamId;
		},
	);
	if (!team || team.leaderId !== actor.id)
		throw new Error("Tindakan ini hanya dapat dilakukan ketua tim.");
	return team;
}

/** Memastikan tindakan operasional hanya dijalankan administrator. */
export function requireAdmin(state: DemoState) {
	const actor = requireActor(state);
	if (actor.role !== "admin")
		throw new Error("Tindakan ini hanya tersedia untuk administrator.");
	return actor;
}

/** Membuat identitas unik untuk data contoh baru. */
export function newId(prefix: string) {
	return `${prefix}-${crypto.randomUUID()}`;
}

/** Memvalidasi isian wajib dan batas panjang tanpa memotong data diam-diam. */
export function requiredText(value: string, label: string, maximum = 500) {
	const cleaned = value.trim();
	if (!cleaned) throw new Error(`${label} wajib diisi.`);
	if (cleaned.length > maximum)
		throw new Error(`${label} maksimal ${maximum} karakter.`);
	return cleaned;
}

/** Memvalidasi tautan HTTP/HTTPS tanpa kredensial atau skema yang dapat menjalankan kode. */
export function safeUrl(value: string) {
	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		throw new Error("Masukkan URL lengkap yang valid.");
	}
	if (
		!["https:", "http:"].includes(url.protocol) ||
		url.username ||
		url.password
	)
		throw new Error("Gunakan link HTTP/HTTPS tanpa kredensial.");
	return url.toString();
}

/** Mencatat pelaku, tindakan dan alasan pada riwayat audit demo. */
export function audit(
	state: DemoState,
	action: string,
	target: string,
	note = "",
) {
	state.audit.unshift({
		id: newId("audit"),
		actorId: requireActor(state).id,
		action,
		target,
		note,
		at: new Date().toISOString(),
	});
}

/** Menambahkan notifikasi aplikasi untuk akun lokal yang dituju. */
export function notify(
	state: DemoState,
	userId: string,
	title: string,
	href: string,
) {
	state.notifications.unshift({
		id: newId("notice"),
		userId,
		title,
		href,
		read: false,
		at: new Date().toISOString(),
	});
}

/** Menambahkan riwayat pelaku dan catatan pada pengajuan yang diubah. */
export function requestEvent(
	state: DemoState,
	request: MentoringRequest,
	label: string,
	note: string,
) {
	request.events.push({
		id: newId("event"),
		actorId: requireActor(state).id,
		label,
		note,
		at: new Date().toISOString(),
	});
}
