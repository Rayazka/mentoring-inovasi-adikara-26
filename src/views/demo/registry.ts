// TODO: Pertahankan registry tanpa ketergantungan balik ke shell agar modul fitur tidak bersiklus.
import type { ComponentType } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
export type DemoView = ComponentType<{
	controller: DemoController;
	pathname: string;
}>;
export const demoViews = new Map<string, DemoView>();
/** Menghubungkan prefix route dengan komponen fitur yang sesuai. */
export function registerDemoView(prefix: string, view: DemoView) {
	demoViews.set(prefix, view);
}
