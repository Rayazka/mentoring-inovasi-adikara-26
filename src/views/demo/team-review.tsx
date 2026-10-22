// TODO: Pertahankan pemisahan daftar anggota dan permintaan ketua saat adapter server tersedia.
"use client";
import { useState } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { Team } from "@/models/demo/types";
import {
	Avatar,
	Badge,
	Button,
	EmptyState,
	Panel,
} from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";

/** Menampilkan anggota tim dan daftar permintaan yang hanya dapat ditinjau ketua. */
export function TeamReview({
	controller,
	team,
}: {
	controller: DemoController;
	team: Team;
}) {
	const { state, actor, dispatch } = controller;
	const [tab, setTab] = useState("anggota");
	if (!state || !actor) return null;
	const leader = team.leaderId === actor.id;
	const joins = state.joins.filter(
		/** Membatasi permintaan pada tim yang sedang dikelola. */
		function teamJoin(item) {
			return item.teamId === team.id && item.status === "pending";
		},
	);
	/** Mengaktifkan tab anggota tim. */
	function showMembers() {
		setTab("anggota");
	}
	/** Mengaktifkan tab permintaan bagi ketua tim. */
	function showRequests() {
		setTab("permintaan");
	}
	return (
		<Panel title="Kelola anggota" icon="team">
			<div className="stack">
				<div className="tabs">
					<button
						type="button"
						className={`tab ${tab === "anggota" ? "active" : ""}`}
						aria-pressed={tab === "anggota"}
						onClick={showMembers}
					>
						Anggota ({team.memberIds.length}/3)
					</button>
					{leader && (
						<button
							type="button"
							className={`tab ${tab === "permintaan" ? "active" : ""}`}
							aria-pressed={tab === "permintaan"}
							onClick={showRequests}
						>
							Permintaan Bergabung ({joins.length})
						</button>
					)}
				</div>
				{tab === "anggota" || !leader ? (
					team.memberIds.map(
						/** Menampilkan identitas anggota dan penanda ketua dari data tim aktif. */
						function memberRow(id) {
							const member = state.users.find(
								/** Mengambil akun yang cocok dengan identitas anggota. */
								function memberName(user) {
									return user.id === id;
								},
							);
							return (
								<div className="member-row" key={id}>
									<div className="row">
										<Avatar name={member?.name ?? "Anggota"} />
										<strong>
											{member?.name}
											{id === actor.id ? " (Kamu)" : ""}
										</strong>
									</div>
									<Badge label={id === team.leaderId ? "Ketua" : "Anggota"} />
								</div>
							);
						},
					)
				) : joins.length ? (
					joins.map(
						/** Menampilkan perkenalan calon anggota dan tindakan persetujuan khusus ketua. */
						function joinRow(join) {
							const applicant = state.users.find(
								/** Mencari nama pengirim permintaan. */
								function applicantAccount(user) {
									return user.id === join.userId;
								},
							);
							/** Menerima calon anggota setelah controller memvalidasi kapasitas terbaru. */
							function acceptJoin() {
								dispatch("team.review", { joinId: join.id, accept: true });
							}
							/** Menolak permintaan dan mengirimkan hasil kepada pemohon. */
							function rejectJoin() {
								dispatch("team.review", { joinId: join.id, accept: false });
							}
							return (
								<article className="subtle-box stack compact" key={join.id}>
									<div className="row">
										<Avatar name={applicant?.name ?? "Peserta"} />
										<div>
											<h3>{applicant?.name}</h3>
											<small>{formatDate(join.createdAt, true)}</small>
										</div>
									</div>
									<p>{join.note}</p>
									<div className="actions">
										<Button
											onClick={acceptJoin}
											disabled={team.memberIds.length >= 3}
										>
											Terima
										</Button>
										<Button variant="danger" onClick={rejectJoin}>
											Tolak
										</Button>
									</div>
									{team.memberIds.length >= 3 && (
										<p className="helper">
											Tim penuh. Permintaan tidak dapat diterima.
										</p>
									)}
								</article>
							);
						},
					)
				) : (
					<EmptyState
						title="Belum ada permintaan baru"
						description="Permintaan dari calon anggota akan muncul di sini."
						icon="team"
					/>
				)}
				{!leader && (
					<p className="helper">
						Hanya ketua yang dapat meninjau permintaan bergabung.
					</p>
				)}
			</div>
		</Panel>
	);
}
