// TODO: Verifikasi kembali pencabutan akses mantan anggota pada adapter produksi.
"use client";
import { useState, type FormEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { Team } from "@/models/demo/types";
import { Button, Modal, Panel } from "@/views/components/ui";

/** Menyediakan dialog keluar dan alih ketua dengan penjelasan dampak perubahan keanggotaan. */
export function TeamMembership({
	controller,
	team,
}: {
	controller: DemoController;
	team: Team;
}) {
	const { state, actor, dispatch } = controller;
	const [dialog, setDialog] = useState("");
	if (!state || !actor) return null;
	const leader = team.leaderId === actor.id;
	/** Menutup dialog tanpa mengubah keanggotaan. */
	function close() {
		setDialog("");
	}
	/** Menampilkan konfirmasi keluar dari tim. */
	function openLeave() {
		setDialog("leave");
	}
	/** Menampilkan pilihan anggota pengganti ketua. */
	function openTransfer() {
		setDialog("transfer");
	}
	/** Menjalankan keluar tim dan menutup dialog hanya bila perubahan tersimpan. */
	function leave() {
		if (dispatch("team.leave")) close();
	}
	/** Mengalihkan kepemimpinan kepada anggota yang dipilih. */
	function transfer(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			dispatch("team.transfer", { teamId: team.id, userId: form.get("userId") })
		)
			close();
	}
	return (
		<>
			<Panel title="Keanggotaan tim">
				<div className="stack compact">
					<p>
						Identitas karya dan riwayat tetap menjadi milik tim. Setelah keluar,
						kamu tidak dapat mengakses dokumen tim ini.
					</p>
					{leader && team.memberIds.length > 1 && (
						<p className="notice warning">
							Kamu adalah ketua. Alihkan kepemimpinan ke anggota aktif sebelum
							keluar.
						</p>
					)}
					<div className="actions">
						{leader && team.memberIds.length > 1 && (
							<Button variant="secondary" onClick={openTransfer}>
								Alihkan ketua
							</Button>
						)}
						<Button variant="danger" onClick={openLeave}>
							Keluar dari tim
						</Button>
					</div>
				</div>
			</Panel>
			<Modal open={dialog === "leave"} title="Keluar dari tim?" onClose={close}>
				<div className="stack">
					<p>
						{team.memberIds.length === 1
							? "Kamu adalah anggota terakhir. Tim akan dibubarkan jika tidak ada pengajuan aktif."
							: "Aksesmu ke identitas karya, dokumen dan pengajuan tim akan dicabut."}
					</p>
					<div className="actions">
						<Button variant="neutral" onClick={close}>
							Batal
						</Button>
						<Button variant="danger" onClick={leave}>
							Ya, keluar
						</Button>
					</div>
				</div>
			</Modal>
			<Modal
				open={dialog === "transfer"}
				title="Alihkan ketua tim"
				onClose={close}
			>
				<form onSubmit={transfer} className="stack">
					<p>Ketua baru akan mengelola anggota dan pengajuan mentoring tim.</p>
					<label className="field">
						Ketua pengganti
						<select name="userId" required defaultValue="">
							<option value="" disabled>
								Pilih anggota aktif
							</option>
							{team.memberIds
								.filter(
									/** Mengecualikan ketua sekarang dari daftar pengganti. */
									function otherMember(id) {
										return id !== team.leaderId;
									},
								)
								.map(
									/** Menampilkan nama anggota aktif sebagai calon ketua baru. */
									function successor(id) {
										const user = state.users.find(
											/** Mencocokkan akun dengan calon ketua. */
											function successorAccount(item) {
												return item.id === id;
											},
										);
										return (
											<option key={id} value={id}>
												{user?.name}
											</option>
										);
									},
								)}
						</select>
					</label>
					<div className="actions">
						<Button variant="neutral" onClick={close}>
							Batal
						</Button>
						<Button type="submit">Alihkan ketua</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
