// TODO: Tampilkan batas pembatalan yang ditetapkan pemilik ketika kebijakan produksi tersedia.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { MentoringRequest } from "@/models/demo/types";
import { teamForUser } from "@/models/demo/selectors";
import { Button, Modal, Panel } from "@/views/components/ui";
import { registerRequestAction } from "./registry";

/** Menyediakan pembatalan beralasan bagi ketua atau tindakan darurat admin. */
export function CancellationActions({
	controller,
	request,
	compact = false,
}: {
	controller: DemoController;
	request: MentoringRequest;
	compact?: boolean;
}) {
	const { state, actor, dispatch } = controller;
	const [open, setOpen] = useState(false);
	/** Menampilkan konfirmasi sebelum peserta melepas pengajuan atau reservasi. */
	function confirm() {
		setOpen(true);
	}
	/** Menutup konfirmasi tanpa mengubah sesi. */
	function close() {
		setOpen(false);
	}
	/** Menjalankan pembatalan hanya setelah alasan wajib diisi. */
	function cancel(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (
			dispatch("cancellation.cancel", {
				id: request.id,
				note: new FormData(event.currentTarget).get("note"),
			})
		)
			close();
	}
	if (
		!state ||
		!actor ||
		!["pending", "revision_requested", "approved"].includes(request.status)
	)
		return null;
	const admin = actor.role === "admin";
	const leader =
		actor.role === "participant" &&
		teamForUser(state, actor.id)?.leaderId === actor.id;
	if (!admin && !leader) return null;
	return (
		<>
			{compact ? (
				<Button variant="neutral" onClick={confirm}>
					Batalkan Pengajuan
				</Button>
			) : (
				<Panel title={admin ? "Pembatalan darurat" : "Batalkan pengajuan"}>
					<p>
						{admin
							? "Gunakan untuk keadaan darurat. Alasan dan identitas admin dicatat pada audit."
							: request.status === "approved"
								? "Aturan demo: sesi terkonfirmasi dapat dibatalkan paling lambat 24 jam sebelum mulai. Hubungi admin untuk keadaan darurat."
								: "Pengajuan yang belum disetujui dapat dibatalkan oleh ketua tim."}
					</p>
					<Button variant="danger" onClick={confirm}>
						Batalkan {request.status === "approved" ? "sesi" : "pengajuan"}
					</Button>
				</Panel>
			)}
			<Modal open={open} title="Konfirmasi pembatalan" onClose={close}>
				<form onSubmit={cancel} className="stack">
					<p>
						Jadwal yang sudah terbooking akan dilepas. Tindakan ini tetap
						tercatat dalam riwayat.
					</p>
					<label className="field">
						Alasan pembatalan
						<textarea name="note" required maxLength={2000} />
					</label>
					<div className="actions">
						<Button variant="neutral" onClick={close}>
							Kembali
						</Button>
						<Button type="submit" variant="danger">
							Ya, batalkan
						</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
registerRequestAction("cancellation", CancellationActions);
