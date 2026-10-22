// TODO: Pertahankan statistik dan dokumen sesuai data tim, bukan angka contoh pada ekspor desain.
"use client";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import type { MentoringRequest } from "@/models/demo/types";
import { participantRequestsData } from "@/controllers/demo/participant-requests-controller";
import {
	Avatar,
	Badge,
	Button,
	EmptyState,
	Icon,
	Panel,
} from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";
import { CancellationActions } from "./cancellation";

/** Menyajikan kartu pengajuan peserta dengan mentor, bahan diskusi dan tindakan sesuai status. */
function ActiveRequestCard({
	controller,
	request,
}: {
	controller: DemoController;
	request: MentoringRequest;
}) {
	const { state } = controller;
	if (!state) return null;
	const mentor = state.mentors.find(
		/** Membaca profil yang dirujuk oleh pengajuan aktif. */
		function requestMentor(item) {
			return item.id === request.mentorId;
		},
	);
	const slot = state.slots.find(
		/** Membaca jadwal yang benar-benar tersimpan pada pengajuan. */
		function requestSlot(item) {
			return item.id === request.slotId;
		},
	);
	const team = state.teams.find(
		/** Mengambil nama tim pemilik pengajuan yang sudah disaring controller. */
		function requestTeam(item) {
			return item.id === request.teamId;
		},
	);
	const documents = state.documents.filter(
		/** Menampilkan hanya dokumen yang tercatat pada snapshot dan masih milik tim. */
		function requestDocument(item) {
			return (
				item.teamId === request.teamId && request.documentIds.includes(item.id)
			);
		},
	);
	return (
		<Panel className="participant-request-card">
			<div className="row spread wrap">
				<div>
					<h2>{request.title}</h2>
					<p>
						{request.id} · {team?.name} · Diajukan{" "}
						{formatDate(request.createdAt, true)}
					</p>
				</div>
				<Badge status={request.status} />
			</div>
			<div className="request-card-columns">
				<div className="stack">
					<div>
						<small className="detail-label">Mentor sesi</small>
						<div className="row">
							<Avatar name={mentor?.name ?? "Mentor"} photo={mentor?.photo} />
							<div>
								<h3>{mentor?.name ?? "Mentor tidak tersedia"}</h3>
								<span className="request-expertise">
									{mentor?.expertise} · Mentor ADIKARA 2026
								</span>
							</div>
						</div>
					</div>
					<div>
						<small className="detail-label">Jadwal mentoring</small>
						<div className="row">
							<Icon name="calendar" />
							<strong>
								{slot
									? `${formatDate(slot.date)} · ${slot.start}–${slot.end} WIB`
									: "Jadwal tidak tersedia"}
							</strong>
						</div>
					</div>
				</div>
				<div className="stack compact">
					<small className="detail-label">Dokumen pengajuan</small>
					{documents.length ? (
						documents.map(
							/** Menyajikan nama bahan tanpa mengklaim izin Drive sudah terverifikasi otomatis. */
							function documentSummary(doc) {
								return (
									<div key={doc.id} className="request-document-summary">
										<Icon name="file" />
										<div>
											<strong>{doc.title}</strong>
											<small>
												{doc.kind === "drive" ? "Google Drive" : "Berkas tim"} ·{" "}
												{formatDate(doc.updatedAt)}
											</small>
										</div>
										{doc.inaccessible && (
											<Badge label="Periksa akses" tone="warning" />
										)}
									</div>
								);
							},
						)
					) : (
						<p>
							Belum ada dokumen pada pengajuan ini.{" "}
							<Link
								className="text-link"
								href="/peserta/karya#dokumen-pendukung"
							>
								Kelola dokumen karya
							</Link>
						</p>
					)}
					<Link href={`/peserta/pengajuan/${request.id}`} className="button">
						Tinjau Pengajuan
					</Link>
					<CancellationActions
						controller={controller}
						request={request}
						compact
					/>
				</div>
			</div>
			{request.status === "approved" && request.meetingUrl ? (
				<a
					className="button secondary"
					href={request.meetingUrl}
					target="_blank"
					rel="noreferrer"
				>
					Buka Pertemuan <Icon name="external" />
				</a>
			) : (
				<p
					className={`notice ${request.status === "pending" ? "warning" : ""}`}
				>
					{request.status === "pending"
						? "Pengajuan menunggu respons mentor. Tautan Pertemuan belum tersedia sampai pengajuan disetujui."
						: request.status === "revision_requested"
							? request.note ||
								"Mentor meminta revisi. Tinjau catatan dan kirim ulang pengajuan."
							: "Jadwal telah dikonfirmasi. Pantau detail pengajuan untuk informasi pertemuan."}
				</p>
			)}
		</Panel>
	);
}

/** Menampilkan pengajuan aktif, ringkasan status dan riwayat dengan filter yang mempertahankan konteks tim. */
export function ParticipantRequests({
	controller,
}: {
	controller: DemoController;
}) {
	const { state, actor } = controller;
	const [tab, setTab] = useState("active");
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("");
	if (!state || !actor) return null;
	const data = participantRequestsData(state, actor);
	/** Mengaktifkan ringkasan pengajuan yang masih berjalan. */
	function showActive() {
		setTab("active");
	}
	/** Mengaktifkan riwayat seluruh pengajuan yang sudah berakhir. */
	function showHistory() {
		setTab("history");
	}
	/** Menyaring riwayat berdasarkan judul atau nomor pengajuan. */
	function changeSearch(event: ChangeEvent<HTMLInputElement>) {
		setSearch(event.target.value);
	}
	/** Menyaring riwayat berdasarkan status akhirnya. */
	function changeStatus(event: ChangeEvent<HTMLSelectElement>) {
		setStatus(event.target.value);
	}
	const history = data.history.filter(
		/** Menggabungkan pencarian dan status pada riwayat milik tim saja. */
		function matchingHistory(item) {
			return (
				(!status || item.status === status) &&
				`${item.id} ${item.title}`.toLowerCase().includes(search.toLowerCase())
			);
		},
	);
	return (
		<>
			<nav className="local-navigation" aria-label="Bagian Pengajuan Mentoring">
				<button
					type="button"
					className={tab === "active" ? "is-active" : ""}
					aria-pressed={tab === "active"}
					onClick={showActive}
				>
					Pengajuan Aktif <span className="count">{data.active.length}</span>
				</button>
				<button
					type="button"
					className={tab === "history" ? "is-active" : ""}
					aria-pressed={tab === "history"}
					onClick={showHistory}
				>
					Riwayat <span className="count">{data.history.length}</span>
				</button>
			</nav>
			{tab === "active" &&
				(data.active.length ? (
					data.active.map(
						/** Menampilkan setiap sesi aktif tanpa menyembunyikan sesi terkonfirmasi lain. */
						function activeCard(request) {
							return (
								<ActiveRequestCard
									key={request.id}
									controller={controller}
									request={request}
								/>
							);
						},
					)
				) : (
					<Panel>
						<EmptyState
							title="Belum ada pengajuan aktif"
							description="Temukan mentor dan waktu diskusi setelah tim serta identitas karya siap."
							icon="request"
						>
							<Link
								href={data.team ? "/peserta/mentor" : "/peserta/tim"}
								className="button"
							>
								{data.team ? "Cari Mentor" : "Ke Tim Saya"}
							</Link>
						</EmptyState>
					</Panel>
				))}
			<Panel
				title="Ringkasan status"
				actions={<span>{data.requests.length} pengajuan</span>}
			>
				<div className="request-status-summary">
					{[
						{ id: "pending", label: "Menunggu respons" },
						{ id: "revision_requested", label: "Perlu revisi" },
						{ id: "approved", label: "Disetujui" },
						{ id: "completed", label: "Selesai" },
					].map(
						/** Menghitung statistik secara langsung dari pengajuan tim yang diizinkan. */
						function statusSummary(item) {
							const requests = data.requests.filter(
								/** Menghitung pengajuan pada satu keadaan proses. */
								function sameStatus(request) {
									return request.status === item.id;
								},
							);
							return (
								<div key={item.id}>
									<small>{item.label}</small>
									<strong>{requests.length}</strong>
									<span>{requests[0]?.id ?? "Belum ada"}</span>
								</div>
							);
						},
					)}
				</div>
			</Panel>
			<Panel
				title="Riwayat pengajuan"
				actions={<span>{history.length} pengajuan sebelumnya</span>}
			>
				{tab === "history" && (
					<div className="request-history-filters">
						<label className="field">
							Cari pengajuan
							<input
								type="search"
								value={search}
								onChange={changeSearch}
								placeholder="Judul karya atau ID pengajuan"
							/>
						</label>
						<label className="field">
							Status
							<select value={status} onChange={changeStatus}>
								<option value="">Semua status</option>
								<option value="completed">Selesai</option>
								<option value="rejected">Ditolak</option>
								<option value="cancelled">Dibatalkan</option>
							</select>
						</label>
					</div>
				)}
				{history.length ? (
					history.map(
						/** Menampilkan baris riwayat dengan akses ke detail dan jejak keputusan. */
						function historyRow(request) {
							const slot = state.slots.find(
								/** Membaca waktu sesi pada pengajuan sebelumnya. */
								function historicSlot(item) {
									return item.id === request.slotId;
								},
							);
							return (
								<div className="request-history-row" key={request.id}>
									<div>
										<strong>
											{request.id} · {data.team?.name}
										</strong>
										<p>{request.title}</p>
									</div>
									<span>
										{slot
											? `${formatDate(slot.date)} · ${slot.start} WIB`
											: "Jadwal tidak tersedia"}
									</span>
									<Badge status={request.status} />
									<Link
										className="text-link"
										href={`/peserta/pengajuan/${request.id}`}
									>
										Tinjau <Icon name="arrow" />
									</Link>
								</div>
							);
						},
					)
				) : (
					<EmptyState
						title={
							search || status
								? "Tidak ada hasil yang sesuai"
								: "Belum ada riwayat pengajuan"
						}
						description="Pengajuan yang selesai, ditolak, atau dibatalkan akan tampil di sini."
						icon="request"
					/>
				)}
			</Panel>
			<Panel title="Ajukan mentoring baru">
				<div className="stack compact">
					<p>
						Pilih mentor dan jadwal setelah informasi karya tim siap. Pengajuan
						menunggu atau perlu revisi harus dituntaskan sebelum membuat
						pengajuan baru.
					</p>
					{data.restriction ? (
						<>
							<Button disabled>Ajukan Mentoring Baru</Button>
							<p className="helper">{data.restriction}</p>
						</>
					) : (
						<Link className="button" href="/peserta/mentor">
							Ajukan Mentoring Baru
						</Link>
					)}
				</div>
			</Panel>
		</>
	);
}
