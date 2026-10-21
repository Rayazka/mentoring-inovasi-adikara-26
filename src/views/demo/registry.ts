// TODO: Pertahankan registry tanpa ketergantungan balik ke shell agar modul fitur tidak bersiklus.
import type { ComponentType } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { MentoringRequest } from "@/models/demo/types";
export type DemoView = ComponentType<{
	controller: DemoController;
	pathname: string;
}>;
export const demoViews = new Map<string, DemoView>();
export const requestActionViews = new Map<
	string,
	ComponentType<{ controller: DemoController; request: MentoringRequest }>
>();
/** Mendaftarkan bagian tindakan pengajuan tanpa menambahkan aturan domain ke detail bersama. */
export function registerRequestAction(
	key: string,
	view: ComponentType<{
		controller: DemoController;
		request: MentoringRequest;
	}>,
) {
	requestActionViews.set(key, view);
}
/** Menghubungkan prefix route dengan komponen fitur yang sesuai. */
export function registerDemoView(prefix: string, view: DemoView) {
	demoViews.set(prefix, view);
}
