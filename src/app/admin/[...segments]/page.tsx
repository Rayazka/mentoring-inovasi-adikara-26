// TODO: Pertahankan guard server pada seluruh route fitur staf.
import { notFound } from "next/navigation";
import { isDemoMode } from "@/models/demo/mode";
import { DemoApplication } from "@/views/demo/application";
import { loadStaffPage } from "@/controllers/connected/staff-page";
import { StaffPage } from "@/views/connected/staff-page";
export const dynamic = "force-dynamic";
/** Mengadaptasi parameter route menjadi halaman operasional staf terverifikasi. */
export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<{ segments: string[] }>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	if (isDemoMode()) return <DemoApplication />;
	const { segments } = await params;
	const data = await loadStaffPage("admin", segments, await searchParams);
	if (data.kind === "not-found") notFound();
	return <StaffPage data={data} />;
}
