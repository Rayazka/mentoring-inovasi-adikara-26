// TODO: Pertahankan catatan kegagalan keputusan ketika respons server produksi tidak tersedia.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { MentoringRequest } from "@/models/demo/types";
import { Button, Modal, Panel } from "@/views/components/ui";
import { registerDemoView, registerRequestAction } from "./registry";
import { RequestsPage } from "./requests";

/** Menyediakan keputusan mentor dengan isian yang sesuai untuk persetujuan, penolakan dan revisi. */
export function ReviewActions({
	controller,
	request,
}: {
	controller: DemoController;
	request: MentoringRequest;
}) {
	const { actor, dispatch } = controller;
	const [decision, setDecision] = useState("");
	/** Menampilkan form persetujuan dengan tautan meeting wajib. */
	function approve() {
		setDecision("approve");
	}
	/** Menampilkan form alasan penolakan. */
	function reject() {
		setDecision("reject");
	}
	/** Menampilkan jenis dan catatan perbaikan yang diminta mentor. */
	function revise() {
		setDecision("revise");
	}
	/** Menutup dialog keputusan tanpa mengubah pengajuan. */
	function close() {
		setDecision("");
	}
	/** Menyimpan keputusan melalui controller, mempertahankan form bila validasi gagal. */
	function save(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			dispatch(`review.${decision}`, {
				id: request.id,
				note: form.get("note"),
				meetingUrl: form.get("meetingUrl"),
				kind: form.get("kind"),
			})
		)
			close();
	}
	if (
		actor?.role !== "mentor" ||
		actor.mentorId !== request.mentorId ||
		!["pending", "revision_requested"].includes(request.status)
	)
		return null;
	return (
		<>
			<Panel title="Respons pengajuan" icon="request">
				<p>
					{request.status === "pending"
						? "Periksa identitas karya dan bahan tim, lalu berikan tanggapan."
						: "Tim sedang menyiapkan revisi. Persetujuan tersedia setelah mereka mengirim ulang."}
				</p>
				<div className="actions">
					{request.status === "pending" && (
						<>
							<Button onClick={approve}>Setujui</Button>
							<Button variant="secondary" onClick={revise}>
								Minta revisi
							</Button>
						</>
					)}
					<Button variant="danger" onClick={reject}>
						Tolak
					</Button>
				</div>
			</Panel>
			<Modal
				open={Boolean(decision)}
				title={
					decision === "approve"
						? "Setujui pengajuan"
						: decision === "reject"
							? "Tolak pengajuan"
							: "Minta revisi"
				}
				onClose={close}
			>
				<form onSubmit={save} className="stack" key={decision}>
					{decision === "approve" && (
						<>
							<p className="helper">
								Slot akan dikunci setelah persetujuan tersimpan. Pengajuan lain
								yang kehilangan slot akan diminta memilih jadwal baru.
							</p>
							<label className="field">
								Link ruang mentoring
								<input
									name="meetingUrl"
									type="url"
									required
									placeholder="https://…"
								/>
							</label>
						</>
					)}
					{decision === "revise" && (
						<label className="field">
							Jenis revisi
							<select name="kind" required>
								<option value="work">Karya / bahan pendukung</option>
								<option value="schedule">Jadwal</option>
								<option value="both">Karya dan jadwal</option>
							</select>
						</label>
					)}
					<label className="field">
						{decision === "approve"
							? "Catatan untuk tim (opsional)"
							: decision === "reject"
								? "Alasan penolakan"
								: "Catatan revisi"}
						<textarea
							name="note"
							required={decision !== "approve"}
							maxLength={2000}
						/>
					</label>
					<div className="actions">
						<Button variant="neutral" onClick={close}>
							Batal
						</Button>
						<Button
							type="submit"
							variant={decision === "reject" ? "danger" : ""}
						>
							Simpan respons
						</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
registerDemoView("/mentor/pengajuan", RequestsPage);
registerRequestAction("mentor-review", ReviewActions);
