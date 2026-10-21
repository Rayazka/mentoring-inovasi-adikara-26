// TODO: Replace fictional sessions with verified Google identities only when connected mode is enabled.
import type { DemoState } from "@/models/demo/types";
import { requiredText } from "./context";

export type CommandPayload = Record<string, unknown>;
export type CommandHandler = (
	state: DemoState,
	action: string,
	payload: CommandPayload,
) => string;

/** Validate a named string payload before it reaches a domain operation. */
export function textValue(payload: CommandPayload, name: string) {
	const value = payload[name];
	if (typeof value !== "string") throw new Error(`Nilai ${name} tidak valid.`);
	return value;
}

/** Sign into a known fictional identity, sign out, or mark owned notifications as read. */
export function sessionCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	if (action === "session.login") {
		const userId = requiredText(textValue(payload, "userId"), "Akun demo");
		const user = state.users.find(function knownAccount(account) {
			return account.id === userId;
		});
		if (!user) throw new Error("Akun demo tidak ditemukan.");
		if (
			user.role === "mentor" &&
			!state.mentors.some(function activeMentor(mentor) {
				return mentor.userId === user.id && mentor.active && !mentor.archived;
			})
		)
			throw new Error("Akun mentor sudah dinonaktifkan.");
		state.userId = userId;
		return `Selamat datang, ${user.name}.`;
	}
	if (action === "session.logout") {
		state.userId = null;
		return "Kamu sudah keluar dari akun demo.";
	}
	if (action === "session.read-notifications") {
		for (const notification of state.notifications)
			if (notification.userId === state.userId) notification.read = true;
		return "Notifikasi ditandai sudah dibaca.";
	}
	throw new Error("Tindakan sesi tidak dikenali.");
}
