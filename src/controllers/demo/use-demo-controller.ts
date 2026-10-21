// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createDemoSeed } from "@/models/demo/seed";
import { teamCommand } from "./team-controller";
import { workCommand } from "./work-controller";
import { documentCommand } from "./document-controller";
import { driveCommand } from "./drive-controller";
import { mentorCommand } from "./mentor-controller";
import {
	getDemoSnapshot,
	getServerDemoSnapshot,
	initializeDemo,
	saveDemo,
	subscribeDemo,
	synchronizeDemo,
} from "@/models/demo/repository";
import {
	sessionCommand,
	type CommandHandler,
	type CommandPayload,
} from "./session-controller";

const handlers: Record<string, CommandHandler> = {
	session: sessionCommand,
	team: teamCommand,
	work: workCommand,
	document: documentCommand,
	drive: driveCommand,
	mentor: mentorCommand,
};

/** Mendaftarkan controller domain tanpa memasukkan aturan bisnis ke dalam view. */
export function registerDemoController(
	domain: string,
	handler: CommandHandler,
) {
	handlers[domain] = handler;
}

/** Menjalankan satu tindakan pada salinan data dan menyimpan hanya jika validasi berhasil. */
export function executeDemoCommand(
	action: string,
	payload: CommandPayload = {},
) {
	const current = getDemoSnapshot();
	if (!current) throw new Error("Data demo belum dimuat.");
	if (action === "session.reset") {
		saveDemo(createDemoSeed());
		return "Data demo dikembalikan ke contoh awal.";
	}
	const handler = handlers[action.split(".")[0]];
	if (!handler) throw new Error("Tindakan ini belum tersedia.");
	const draft = structuredClone(current);
	const message = handler(draft, action, payload);
	saveDemo(draft);
	return message;
}

/** Menghubungkan view dengan model reaktif dan mengubah kegagalan tindakan menjadi pesan yang terbaca. */
export function useDemoController() {
	const state = useSyncExternalStore(
		subscribeDemo,
		getDemoSnapshot,
		getServerDemoSnapshot,
	);
	const [feedback, setFeedback] = useState<{
		message: string;
		error: boolean;
	} | null>(null);
	/** Memuat data browser dan menyelaraskan tab lain tanpa memanggil autentikasi server. */
	useEffect(
		/** Menjalankan langkah hydrateRepository sesuai tanggung jawab modul ini. */
		function hydrateRepository() {
			initializeDemo();
			window.addEventListener("storage", synchronizeDemo);
			/** Melepas pemantauan tab ketika controller halaman tidak lagi digunakan. */
			/** Melepas listener penyimpanan saat komponen dilepas. */
			function cleanupRepository() {
				window.removeEventListener("storage", synchronizeDemo);
			}
			return cleanupRepository;
		},
		[],
	);
	/** Menjalankan permintaan view dan melaporkan kegagalan tanpa perubahan data sebagian. */
	function dispatch(action: string, payload: CommandPayload = {}) {
		try {
			setFeedback({
				message: executeDemoCommand(action, payload),
				error: false,
			});
			return true;
		} catch (error) {
			setFeedback({
				message:
					error instanceof Error ? error.message : "Perubahan gagal disimpan.",
				error: true,
			});
			return false;
		}
	}
	/** Menghapus pesan tampilan setelah ditutup pengguna. */
	function dismissFeedback() {
		setFeedback(null);
	}
	const actor = state?.users.find(
		/** Menjalankan langkah signedIn sesuai tanggung jawab modul ini. */
		function signedIn(user) {
			return user.id === state.userId;
		},
	);
	return { state, actor, dispatch, feedback, dismissFeedback };
}

export type DemoController = ReturnType<typeof useDemoController>;
