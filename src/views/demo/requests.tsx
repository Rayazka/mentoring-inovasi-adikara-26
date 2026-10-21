// TODO: Gunakan proyeksi query berizin untuk daftar dan detail pengajuan produksi.
"use client";
import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { requestForActor } from "@/models/demo/request-policy";
import { teamForUser } from "@/models/demo/selectors";
import { mentorForUser } from "@/models/demo/mentor-policy";
import {
	Badge,
	EmptyState,
	Icon,
	Panel,
	formatDate,
} from "@/views/components/ui";
import { DocumentsPanel } from "./documents";
import { DrivePanel } from "./drive";
import { registerDemoView, requestActionViews } from "./registry";

/** Menampilkan daftar pengajuan sesuai kepemilikan dan detail dengan riwayat yang utuh. */
export function RequestsPage({
	controller,
	pathname,
}: {
	controller: DemoController;
	pathname: string;
}) {
	const { state, actor } = controller;
	const [filter, setFilter] = useState("");
	const [search, setSearch] = useState("");
	/** Menyaring pengajuan berdasarkan status proses. */
	function changeFilter(event: ChangeEvent<HTMLSelectElement>) {
		setFilter(event.target.value);
	}
	/** Menyaring judul karya tanpa mengubah data yang tersimpan. */
	function changeSearch(event: ChangeEvent<HTMLInputElement>) {
		setSearch(event.target.value);
	}
	if (!state || !actor) return null;
	const base =
		actor.role === "participant"
			? "/peserta/pengajuan"
			: actor.role === "mentor"
				? "/mentor/pengajuan"
				: "/admin/operasional";
	const requestId = pathname.split("/")[3];
	if (requestId)
		return (
			<RequestDetail
				controller={controller}
				requestId={requestId}
				base={base}
			/>
		);
	const team = teamForUser(state, actor.id);
	const mentor = mentorForUser(state, actor.id);
	const requests = state.requests.filter(
		/** Membatasi daftar berdasarkan tim peserta, mentor terkait atau peran operasional admin. */
		function visibleRequest(request) {
			const visible =
				actor.role === "admin" ||
				(actor.role === "participant" && request.teamId === team?.id) ||
				(actor.role === "mentor" && request.mentorId === mentor?.id);
			return (
				visible &&
				(!filter || request.status === filter) &&
				`${request.title} ${request.id}`
					.toLowerCase()
					.includes(search.toLowerCase())
			);
		},
	);
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">PERJALANAN MENTORING</span>
					<h1>Pengajuan Mentoring</h1>
					<p>
						Pantau respons, catatan revisi, dan jadwal mentoring dari satu
						tempat.
					</p>
				</div>
				{actor.role === "participant" && (
					<Link className="button" href="/peserta/mentor">
						Cari mentor
					</Link>
				)}
			</div>
			<Panel>
				<div className="filters">
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
						<select value={filter} onChange={changeFilter}>
							<option value="">Semua status</option>
							<option value="pending">Menunggu respons</option>
							<option value="revision_requested">Perlu revisi</option>
							<option value="approved">Disetujui</option>
							<option value="rejected">Ditolak</option>
							<option value="cancelled">Dibatalkan</option>
							<option value="completed">Selesai</option>
						</select>
					</label>
				</div>
			</Panel>
			{requests.length ? (
				<div className="stack">
					{requests.map(
						/** Menampilkan ringkasan status dan jadwal dengan tautan menuju detail pengajuan. */
						function requestCard(request) {
							const slot = state.slots.find(
								/** Mengambil jadwal yang masih dirujuk snapshot pengajuan. */
								function requestedSlot(item) {
									return item.id === request.slotId;
								},
							);
							const profile = state.mentors.find(
								/** Mengambil nama mentor meskipun profilnya telah diarsipkan. */
								function historicalMentor(item) {
									return item.id === request.mentorId;
								},
							);
							return (
								<Panel key={request.id}>
									<div className="stack compact">
										<div className="request-top">
											<small>{request.id}</small>
											<Badge status={request.status} />
										</div>
										<h2 className="request-title">{request.title}</h2>
										<p>
											{profile?.name} ·{" "}
											{slot
												? `${formatDate(slot.date)} · ${slot.start}–${slot.end} WIB`
												: "Jadwal tidak tersedia"}
										</p>
										{request.note && <p className="notice">{request.note}</p>}
										{request.status === "pending" && (
											<p className="helper">
												Jadwal belum terkunci sampai mentor menyetujui.
											</p>
										)}
										<Link className="text-link" href={`${base}/${request.id}`}>
											Lihat detail <Icon name="arrow" />
										</Link>
									</div>
								</Panel>
							);
						},
					)}
				</div>
			) : (
				<Panel>
					<EmptyState
						title={
							actor.role === "participant" && !team
								? "Bergabunglah dengan tim terlebih dahulu"
								: "Belum ada pengajuan yang sesuai"
						}
						description="Pengajuan yang menjadi tanggung jawabmu akan muncul di sini. Coba ubah filter bila diperlukan."
						icon="request"
					>
						{actor.role === "participant" && (
							<Link
								className="button"
								href={team ? "/peserta/mentor" : "/peserta/tim"}
							>
								{team ? "Cari mentor" : "Ke Tim Saya"}
							</Link>
						)}
					</EmptyState>
				</Panel>
			)}
		</>
	);
}

/** Menyajikan snapshot karya saat submit serta riwayat dan bahan terkini bagi pemilik akses. */
function RequestDetail({
	controller,
	requestId,
	base,
}: {
	controller: DemoController;
	requestId: string;
	base: string;
}) {
	const { state, actor } = controller;
	if (!state || !actor) return null;
	let request;
	try {
		request = requestForActor(state, requestId);
	} catch {
		return (
			<Panel>
				<EmptyState
					title="Pengajuan tidak dapat dibuka"
					description="Data tidak ditemukan atau kamu bukan pemilik akses pengajuan ini."
					icon="request"
				>
					<Link href={base} className="button">
						Kembali ke daftar
					</Link>
				</EmptyState>
			</Panel>
		);
	}
	const slot = state.slots.find(
		/** Mengambil rentang jadwal pengajuan yang dilihat. */
		function requestSlot(item) {
			return item.id === request.slotId;
		},
	);
	const mentor = state.mentors.find(
		/** Mengambil profil historis mentor pengajuan ini. */
		function requestMentor(item) {
			return item.id === request.mentorId;
		},
	);
	const team = state.teams.find(
		/** Menampilkan identitas tim tanpa bergantung pada identitas pengirim pertama. */
		function requestTeam(item) {
			return item.id === request.teamId;
		},
	);
	return (
		<>
			<Link className="text-link" href={base}>
				← Kembali ke daftar pengajuan
			</Link>
			<div className="section-heading">
				<div>
					<span className="eyebrow">{request.id}</span>
					<h1>Detail Pengajuan</h1>
					<p>Dikirim {formatDate(request.createdAt, true)}</p>
				</div>
				<Badge status={request.status} />
			</div>
			{request.note && (
				<p
					className={`notice ${request.status === "rejected" ? "danger" : "warning"}`}
				>
					{request.note}
				</p>
			)}
			<div className="grid-2">
				<Panel title="Mentor & jadwal" icon="calendar">
					<dl className="info-grid">
						<dt>Tim</dt>
						<dd>{team?.name ?? "Tim sudah dibubarkan"}</dd>
						<dt>Mentor</dt>
						<dd>{mentor?.name}</dd>
						<dt>Jadwal</dt>
						<dd>
							{slot
								? `${formatDate(slot.date)} · ${slot.start}–${slot.end} WIB`
								: "Tidak ditemukan"}
						</dd>
						<dt>Jeda sampai</dt>
						<dd>{slot?.bufferEnd} WIB</dd>
					</dl>
					{request.status === "approved" && request.meetingUrl && (
						<a
							className="button"
							href={request.meetingUrl}
							target="_blank"
							rel="noreferrer"
						>
							Buka ruang mentoring <Icon name="external" />
						</a>
					)}
				</Panel>
				<Panel title="Snapshot Identitas Karya" icon="file">
					<h3>{request.title}</h3>
					<p style={{ whiteSpace: "pre-wrap" }}>{request.description}</p>
					<p className="helper">
						Informasi karya saat versi terakhir dikirim. Perubahan pada
						Identitas Karya tidak mengubah snapshot ini sebelum dikirim ulang.
					</p>
				</Panel>
			</div>
			{[...requestActionViews.entries()].map(
				/** Memasang tindakan yang memeriksa peran dan statusnya masing-masing. */
				function actionView([key, Action]) {
					return <Action key={key} controller={controller} request={request} />;
				},
			)}
			{actor.role !== "admin" && (
				<>
					<DocumentsPanel
						controller={controller}
						teamId={request.teamId}
						readonly
					/>
					<DrivePanel
						controller={controller}
						teamId={request.teamId}
						readonly
					/>
				</>
			)}
			{request.documentIds.some(
				/** Menandai referensi historis yang dokumennya telah dihapus dari tim. */
				function missingDocument(id) {
					return !state.documents.some(
						/** Memeriksa keberadaan metadata dokumen rujukan pengajuan. */
						function existingDocument(item) {
							return item.id === id;
						},
					);
				},
			) && (
				<p className="notice warning">
					Sebagian dokumen pada versi pengajuan ini sudah dihapus oleh tim.
					Bahan terkini tampil di atas.
				</p>
			)}
			<Panel title="Riwayat pengajuan" icon="clock">
				<ol className="timeline">
					{request.events.map(
						/** Menampilkan pelaku, waktu dan alasan dari setiap tindakan yang tercatat. */
						function historyEvent(event) {
							const author = state.users.find(
								/** Mengambil nama pelaku dari riwayat tanpa mengubah kepemilikan tim. */
								function eventAuthor(user) {
									return user.id === event.actorId;
								},
							);
							return (
								<li className="timeline-item" key={event.id}>
									<strong>{event.label}</strong>
									<p>{event.note}</p>
									<small>
										{author?.name ?? "Sistem"} · {formatDate(event.at, true)}
									</small>
								</li>
							);
						},
					)}
				</ol>
			</Panel>
		</>
	);
}
registerDemoView("/peserta/pengajuan", RequestsPage);
