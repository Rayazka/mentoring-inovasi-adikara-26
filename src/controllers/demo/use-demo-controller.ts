// TODO: Preserve the model/view boundary when replacing this local command adapter with server actions.
"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createDemoSeed } from "@/models/demo/seed";
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

const handlers: Record<string, CommandHandler> = { session: sessionCommand };

/** Register a single domain controller without embedding its business rules in React views. */
export function registerDemoController(
	domain: string,
	handler: CommandHandler,
) {
	handlers[domain] = handler;
}

/** Execute one command against a private draft and persist only after its validation succeeds. */
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

/** Connect a route view to reactive model data and translate command errors into persistent feedback. */
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
	/** Hydrate browser data and keep other tabs synchronized without server authentication calls. */
	useEffect(function hydrateRepository() {
		initializeDemo();
		window.addEventListener("storage", synchronizeDemo);
		/** Remove the cross-tab listener when this route controller unmounts. */
		return function cleanupRepository() {
			window.removeEventListener("storage", synchronizeDemo);
		};
	}, []);
	/** Run a view-requested operation and report failures without partially updating the model. */
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
	/** Clear only presentation feedback after the user dismisses it. */
	function dismissFeedback() {
		setFeedback(null);
	}
	const actor = state?.users.find(function signedIn(user) {
		return user.id === state.userId;
	});
	return { state, actor, dispatch, feedback, dismissFeedback };
}

export type DemoController = ReturnType<typeof useDemoController>;
