// TODO: Pertahankan konteks jadwal lama dan baru saat konfirmasi perubahan memakai API produksi.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { MentoringRequest } from "@/models/demo/types";
import { teamForUser } from "@/models/demo/selectors";
import { slotIsBooked } from "@/models/demo/slot-policy";
import { Button, Modal, Panel, formatDate } from "@/views/components/ui";
import { registerRequestAction } from "./registry";

/** Menampilkan perbandingan jadwal dan kesepakatan dua pihak untuk sesi yang sudah disetujui. */
export function RescheduleActions({
	controller,
	request,
}: {
	controller: DemoController;
	request: MentoringRequest;
}) {
	const { state, actor, dispatch } = controller;
	const [open, setOpen] = useState(false);
	/** Menampilkan formulir usulan jadwal baru. */
	function propose() {
		setOpen(true);
	}
	/** Menutup formulir tanpa mengganti booking lama. */
	function close() {
		setOpen(false);
	}
	/** Mengirim usulan yang belum memesan slot baru. */
	function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			dispatch("reschedule.propose", {
				id: request.id,
				slotId: form.get("slotId"),
				note: form.get("note"),
			})
		)
			close();
	}
	/** Menyetujui perpindahan setelah pemeriksaan ulang target slot. */
	function accept() {
		dispatch("reschedule.respond", { id: request.id, accept: true });
	}
	/** Menolak usulan dan mempertahankan booking serta link meeting sebelumnya. */
	function reject() {
		dispatch("reschedule.respond", { id: request.id, accept: false });
	}
	if (
		!state ||
		!actor ||
		request.status !== "approved" ||
		actor.role === "admin"
	)
		return null;
	const leader =
		actor.role === "participant" &&
		teamForUser(state, actor.id)?.leaderId === actor.id;
	const eligible = leader || actor.role === "mentor";
	const next = state.slots.find(
		/** Mengambil detail jadwal yang diusulkan sebagai pembanding booking aktif. */
		function proposedSlot(slot) {
			return slot.id === request.change?.slotId;
		},
	);
	const author = state.users.find(
		/** Menampilkan pihak pengusul agar peserta memahami siapa yang perlu merespons. */
		function proposalAuthor(user) {
			return user.id === request.change?.authorId;
		},
	);
	return (
		<>
			<Panel title="Perubahan jadwal sesi" icon="calendar">
				<div className="stack">
					{request.change ? (
						<>
							<p className="notice warning">
								Booking lama tetap berlaku. Jadwal baru belum terkunci sampai
								pihak lain menyetujui.
							</p>
							<div className="subtle-box">
								<strong>
									Usulan:{" "}
									{next
										? `${formatDate(next.date)} · ${next.start}–${next.end} WIB`
										: "Slot tidak tersedia"}
								</strong>
								<p>{request.change.note}</p>
								<small>Diajukan oleh {author?.name}</small>
							</div>
							{eligible && author?.role !== actor.role ? (
								<div className="actions">
									<Button onClick={accept}>Terima perubahan</Button>
									<Button variant="danger" onClick={reject}>
										Tolak perubahan
									</Button>
								</div>
							) : (
								<p className="helper">Menunggu kesepakatan pihak lainnya.</p>
							)}
						</>
					) : (
						<>
							<p>
								Ajukan jadwal pengganti kepada{" "}
								{actor.role === "mentor" ? "ketua tim" : "mentor"}. Jadwal lama
								tetap berlaku sampai usulan disepakati.
							</p>
							{eligible && (
								<Button variant="secondary" onClick={propose}>
									Usulkan perubahan jadwal
								</Button>
							)}
						</>
					)}
				</div>
			</Panel>
			<Modal open={open} title="Usulkan perubahan jadwal" onClose={close}>
				<form className="stack" onSubmit={save}>
					<label className="field">
						Jadwal pengganti
						<select name="slotId" required defaultValue="">
							<option value="" disabled>
								Pilih jadwal baru
							</option>
							{state.slots
								.filter(
									/** Membatasi pilihan pada slot aktif mentor yang sama dan tidak sama dengan jadwal lama. */
									function availableSlot(slot) {
										return (
											slot.mentorId === request.mentorId &&
											slot.id !== request.slotId &&
											slot.enabled &&
											!slotIsBooked(state, slot.id) &&
											new Date(
												`${slot.date}T${slot.start}:00+07:00`,
											).getTime() > Date.now()
										);
									},
								)
								.map(
									/** Menampilkan jam dan tanggal target perpindahan dalam WIB. */
									function slotOption(slot) {
										return (
											<option key={slot.id} value={slot.id}>
												{formatDate(slot.date)} · {slot.start}–{slot.end} WIB
											</option>
										);
									},
								)}
						</select>
					</label>
					<label className="field">
						Alasan perubahan
						<textarea name="note" required maxLength={2000} />
					</label>
					<div className="actions">
						<Button variant="neutral" onClick={close}>
							Batal
						</Button>
						<Button type="submit">Kirim usulan</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
registerRequestAction("reschedule", RescheduleActions);
