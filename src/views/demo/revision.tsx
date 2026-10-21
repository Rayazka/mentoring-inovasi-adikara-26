// TODO: Pertahankan catatan mentor dan konteks perbaikan ketika formulir revisi memakai server.
"use client";
import Link from "next/link";
import type { FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { MentoringRequest } from "@/models/demo/types";
import { teamForUser } from "@/models/demo/selectors";
import { slotIsBooked } from "@/models/demo/slot-policy";
import { Button, Panel, formatDate } from "@/views/components/ui";
import { registerRequestAction } from "./registry";

/** Menyajikan perbaikan karya dan pemilihan jadwal ulang sesuai jenis revisi untuk ketua tim. */
export function RevisionActions({
	controller,
	request,
}: {
	controller: DemoController;
	request: MentoringRequest;
}) {
	const { state, actor, dispatch } = controller;
	/** Mengirim ulang hanya setelah peserta memperbaiki karya dan menulis ringkasan perubahan. */
	function resubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		dispatch("revision.resubmit", {
			id: request.id,
			note: form.get("note"),
			slotId:
				request.revisionKind === "work" ? request.slotId : form.get("slotId"),
		});
	}
	if (
		!state ||
		actor?.role !== "participant" ||
		request.status !== "revision_requested"
	)
		return null;
	const leader = teamForUser(state, actor.id)?.leaderId === actor.id;
	return (
		<Panel title="Perbaikan pengajuan" icon="request">
			<div className="stack">
				<p className="notice warning">
					Jenis revisi:{" "}
					{request.revisionKind === "work"
						? "Karya dan bahan pendukung"
						: request.revisionKind === "schedule"
							? "Jadwal"
							: "Karya dan jadwal"}
					. Catatan mentor tetap tersimpan pada riwayat pengajuan.
				</p>
				<Link href="/peserta/karya#judul-topik" className="button secondary">
					Perbaiki Identitas Karya & dokumen
				</Link>
				<p className="helper">
					Menyimpan karya tidak otomatis mengirim revisi. Kembali ke detail ini
					untuk mengirim ulang.
				</p>
				{leader ? (
					<form className="stack" onSubmit={resubmit}>
						{request.revisionKind !== "work" && (
							<label className="field">
								Pilih jadwal pengganti
								<select name="slotId" required defaultValue="">
									<option value="" disabled>
										Pilih slot tersedia
									</option>
									{state.slots
										.filter(
											/** Menawarkan jadwal aktif dari mentor yang sama dan belum dipesan. */
											function revisionSlot(slot) {
												return (
													slot.mentorId === request.mentorId &&
													slot.enabled &&
													!slotIsBooked(state, slot.id) &&
													new Date(
														`${slot.date}T${slot.start}:00+07:00`,
													).getTime() > Date.now()
												);
											},
										)
										.sort(
											/** Mengurutkan tanggal dan jam pilihan revisi. */
											function chronological(a, b) {
												return `${a.date}${a.start}`.localeCompare(
													`${b.date}${b.start}`,
												);
											},
										)
										.map(
											/** Menampilkan jadwal baru lengkap dengan zona waktu. */
											function slotOption(slot) {
												return (
													<option key={slot.id} value={slot.id}>
														{formatDate(slot.date)} · {slot.start}–{slot.end}{" "}
														WIB
													</option>
												);
											},
										)}
								</select>
							</label>
						)}
						<label className="field">
							Ringkasan perbaikan
							<textarea
								name="note"
								required
								maxLength={2000}
								placeholder="Jelaskan apa yang sudah diperbaiki berdasarkan catatan mentor."
							/>
						</label>
						<Button type="submit">Kirim ulang revisi</Button>
					</form>
				) : (
					<p>Ketua tim yang mengirim ulang revisi setelah perbaikan selesai.</p>
				)}
			</div>
		</Panel>
	);
}
registerRequestAction("participant-revision", RevisionActions);
