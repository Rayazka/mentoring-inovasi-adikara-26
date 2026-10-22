// TODO: Pertahankan konfirmasi tindakan dan pilihan pengganti sesuai anggota aktif terbaru.
"use client";
import { useState } from "react";
import { changeParticipantMembership } from "@/controllers/connected/team-membership-actions";
import type { ParticipantTeam, TeamMember } from "@/models/connected/team";
import { Modal, Panel } from "@/views/components/ui";
import { MutationForm, type FormField } from "./mutation-form";

/** Menyajikan konfirmasi keluar dan alih ketua tanpa menghapus karya atau riwayat tim. */
export function TeamMembershipActions({
	team,
	members,
	userId,
}: {
	team: ParticipantTeam;
	members: TeamMember[];
	userId: string;
}) {
	const [operation, setOperation] = useState<"leave" | "transfer" | null>(null);
	const leader = team.leader_id === userId;
	const successors = members.filter(
		/** Menyaring anggota lain yang dapat dipilih sebagai ketua pengganti. */
		function successor(member) {
			return member.user_id !== userId;
		},
	);
	const labels = Object.fromEntries(
		successors.map(
			/** Menggunakan nama anggota sebagai label pilihan, bukan menampilkan UUID. */
			function option(member) {
				return [member.user_id, member.full_name];
			},
		),
	);
	/** Membuka dialog keluar tim yang menjelaskan dampak pada akses. */
	function leave() {
		setOperation("leave");
	}
	/** Membuka dialog alih ketua tanpa mengeluarkan anggota saat ini. */
	function transfer() {
		setOperation("transfer");
	}
	/** Menutup dialog konfirmasi tanpa mengubah database. */
	function close() {
		setOperation(null);
	}
	const fields: FormField[] = [
		{
			name: "operation",
			label: "Tindakan",
			type: "hidden",
			value: operation ?? "leave",
		},
	];
	if (leader && successors.length)
		fields.push({
			name: "successor",
			label: "Ketua pengganti",
			type: "select",
			required: true,
			options: successors.map(
				/** Menyertakan hanya identitas anggota aktif dalam pilihan. */
				function id(member) {
					return member.user_id;
				},
			),
			optionLabels: labels,
		});
	fields.push({
		name: "confirmation",
		label: "Ketik KONFIRMASI untuk melanjutkan",
		required: true,
		maxLength: 10,
	});
	return (
		<Panel title="Kelola Keanggotaan">
			<div className="stack">
				<p>
					Setelah keluar, akses ke karya, dokumen, dan pengajuan tim akan
					dicabut. Riwayat tetap menjadi milik tim.
				</p>
				<div className="row wrap">
					{leader && successors.length > 0 && (
						<button
							className="button secondary"
							type="button"
							onClick={transfer}
						>
							Alihkan ketua
						</button>
					)}
					<button className="button neutral" type="button" onClick={leave}>
						Keluar tim
					</button>
				</div>
			</div>
			<Modal
				open={operation !== null}
				title={
					operation === "transfer" ? "Alihkan ketua tim?" : "Keluar dari tim?"
				}
				onClose={close}
			>
				{operation !== null && (
					<div className="stack" key={operation}>
						<p>
							{operation === "transfer"
								? "Kamu tetap menjadi anggota. Kewenangan ketua berpindah kepada anggota yang dipilih."
								: leader && successors.length
									? "Pilih ketua pengganti agar tim tetap memiliki pemimpin setelah kamu keluar."
									: leader
										? "Tim terakhir akan diarsipkan. Tuntaskan atau batalkan pengajuan aktif terlebih dahulu."
										: "Kamu perlu meminta bergabung kembali jika ingin kembali menjadi anggota."}
						</p>
						<MutationForm
							action={changeParticipantMembership}
							fields={fields}
							submit={
								operation === "transfer"
									? "Konfirmasi alih ketua"
									: "Konfirmasi keluar tim"
							}
						/>
					</div>
				)}
			</Modal>
		</Panel>
	);
}
