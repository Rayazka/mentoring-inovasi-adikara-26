// TODO: Bandingkan editor jadwal dengan data booking nyata setelah integrasi database tersedia.
"use client";
import { useState, type FormEvent, type ChangeEvent } from "react";
import type { DemoController } from "@/controllers/demo/use-demo-controller";
import { generateSlots } from "@/lib/mentoring/schedule";
import { slotIsBooked } from "@/models/demo/slot-policy";
import {
	Badge,
	Button,
	EmptyState,
	Modal,
	Panel,
} from "@/views/components/ui";
import { formatDate } from "@/lib/format/date";
import { registerDemoView } from "./registry";

/** Menyajikan editor jam default serta pembentukan dan penyuntingan slot per mentor. */
export function SchedulesPage({ controller }: { controller: DemoController }) {
	const { state, actor, dispatch } = controller;
	const isAdmin = actor?.role === "admin";
	const [selectedMentorId, setMentorId] = useState(state?.mentors[0]?.id ?? "");
	const mentorId = isAdmin ? selectedMentorId : (actor?.mentorId ?? "");
	const [date, setDate] = useState(state?.settings.dates[0] ?? "2026-10-24");
	const [editing, setEditing] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);
	/** Mengganti mentor dan mengembalikan tanggal ke hari tersedia pertama. */
	function changeMentor(event: ChangeEvent<HTMLSelectElement>) {
		const id = event.target.value;
		setMentorId(id);
		const mentor = state?.mentors.find(
			/** Mengambil daftar hari mentor terpilih untuk menghindari pilihan yang tidak sah. */
			function selectedMentor(item) {
				return item.id === id;
			},
		);
		if (mentor) setDate(mentor.dates[0]);
	}
	/** Mengganti tanggal jadwal yang dikelola. */
	function changeDate(event: ChangeEvent<HTMLSelectElement>) {
		setDate(event.target.value);
	}
	/** Menyimpan rentang jam dan durasi default tanpa memindahkan booking secara otomatis. */
	function settings(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		dispatch("schedule.settings", {
			start: form.get("start"),
			end: form.get("end"),
			sessionMinutes: Number(form.get("sessionMinutes")),
			bufferMinutes: Number(form.get("bufferMinutes")),
		});
	}
	/** Membuka form satu slot tambahan. */
	function addSlot() {
		setEditing("");
	}
	/** Menutup penyuntingan tanpa menyimpan. */
	function closeEdit() {
		setEditing(null);
	}
	/** Menampilkan pratinjau pembentukan jadwal sebelum diterapkan. */
	function previewGeneration() {
		setGenerating(true);
	}
	/** Menutup pratinjau pembentukan slot. */
	function closeGeneration() {
		setGenerating(false);
	}
	/** Menerapkan pembentukan slot pada mentor dan tanggal terpilih. */
	function generate() {
		if (dispatch("schedule.generate", { mentorId, date })) closeGeneration();
	}
	/** Menyimpan tambahan atau perubahan waktu slot kosong. */
	function saveSlot(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		if (
			dispatch("schedule.save", {
				mentorId,
				date,
				id: editing,
				start: form.get("start"),
			})
		)
			closeEdit();
	}
	if (!state) return null;
	const mentor = state.mentors.find(
		/** Mengambil profil mentor untuk label dan tanggal yang tersedia. */
		function chosenMentor(item) {
			return item.id === mentorId;
		},
	);
	const slots = state.slots
		.filter(
			/** Membatasi daftar slot pada mentor dan tanggal yang sedang dikelola. */
			function selectedSlot(slot) {
				return slot.mentorId === mentorId && slot.date === date;
			},
		)
		.sort(
			/** Mengurutkan waktu mulai untuk memudahkan pemeriksaan celah jadwal. */
			function chronological(a, b) {
				return a.start.localeCompare(b.start);
			},
		);
	const current = slots.find(
		/** Mengambil nilai awal untuk penyuntingan slot kosong. */
		function editedSlot(slot) {
			return slot.id === editing;
		},
	);
	const preview = generateSlots(state.settings);
	const conflicts = slots.filter(
		/** Menandai booking yang berada di luar jam default baru tanpa memindahkannya. */
		function protectedConflict(slot) {
			return (
				slotIsBooked(state, slot.id) &&
				(slot.start < state.settings.start ||
					slot.bufferEnd > state.settings.end)
			);
		},
	);
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">
						{isAdmin ? "ADMINISTRASI" : "RUANG MENTOR"}
					</span>
					<h1>{isAdmin ? "Kelola Jadwal" : "Ketersediaan Jadwal"}</h1>
					<p>
						Atur jam operasional dan ketersediaan setiap mentor. Semua waktu
						menggunakan WIB.
					</p>
				</div>
			</div>
			{isAdmin && (
				<Panel title="Jam operasional default" icon="clock">
					<form className="stack" onSubmit={settings}>
						<div className="form-grid">
							<label className="field">
								Mulai
								<input
									name="start"
									type="time"
									required
									defaultValue={state.settings.start}
								/>
							</label>
							<label className="field">
								Berakhir
								<input
									name="end"
									type="time"
									required
									defaultValue={state.settings.end}
								/>
							</label>
							<label className="field">
								Sesi (menit)
								<input
									name="sessionMinutes"
									type="number"
									required
									min={1}
									max={180}
									defaultValue={state.settings.sessionMinutes}
								/>
							</label>
							<label className="field">
								Jeda (menit)
								<input
									name="bufferMinutes"
									type="number"
									required
									min={0}
									max={60}
									defaultValue={state.settings.bufferMinutes}
								/>
							</label>
						</div>
						<div className="row spread wrap">
							<p className="helper">
								Default awal 18.30–22.00 · 15 menit sesi + 5 menit jeda.
								Perubahan tidak memindahkan booking lama.
							</p>
							<Button type="submit">Simpan pengaturan</Button>
						</div>
					</form>
				</Panel>
			)}
			<Panel title="Jadwal per mentor" icon="calendar">
				<div className="stack">
					<div className="filters">
						{isAdmin && (
							<label className="field">
								Mentor
								<select value={mentorId} onChange={changeMentor}>
									{state.mentors
										.filter(
											/** Menyembunyikan mentor yang sudah diarsipkan dari editor jadwal. */
											function schedulable(item) {
												return !item.archived;
											},
										)
										.map(
											/** Menampilkan pilihan profil mentor yang masih dapat dikelola. */
											function mentorOption(item) {
												return (
													<option key={item.id} value={item.id}>
														{item.name}
													</option>
												);
											},
										)}
								</select>
							</label>
						)}
						<label className="field">
							Tanggal
							<select value={date} onChange={changeDate}>
								{mentor?.dates.map(
									/** Membatasi pilihan hari sesuai ketersediaan mentor. */
									function dateOption(day) {
										return (
											<option key={day} value={day}>
												{formatDate(day)}
											</option>
										);
									},
								)}
							</select>
						</label>
						<div className="actions">
							<Button variant="secondary" onClick={previewGeneration}>
								Bentuk slot otomatis
							</Button>
							<Button onClick={addSlot}>Tambah slot</Button>
						</div>
					</div>
					{conflicts.length > 0 && (
						<p className="notice warning">
							{conflicts.length} booking berada di luar rentang baru dan tetap
							dipertahankan. Tangani melalui perubahan sesi pada operasional.
						</p>
					)}
					{slots.length ? (
						<div className="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Sesi WIB</th>
										<th>Jeda sampai</th>
										<th>Status</th>
										<th>Tindakan</th>
									</tr>
								</thead>
								<tbody>
									{slots.map(
										/** Menampilkan status slot dan menonaktifkan tindakan yang akan merusak booking. */
										function slotRow(slot) {
											const booked = slotIsBooked(state, slot.id);
											/** Membuka penyuntingan waktu slot yang belum terkonfirmasi. */
											function edit() {
												setEditing(slot.id);
											}
											/** Mengubah ketersediaan dengan pemeriksaan benturan di controller. */
											function toggle() {
												dispatch("schedule.toggle", {
													mentorId,
													date,
													id: slot.id,
												});
											}
											/** Menghapus slot kosong yang tidak memiliki referensi riwayat. */
											function remove() {
												dispatch("schedule.delete", {
													mentorId,
													date,
													id: slot.id,
												});
											}
											return (
												<tr key={slot.id}>
													<td>
														<strong>
															{slot.start}–{slot.end}
														</strong>
													</td>
													<td>{slot.bufferEnd}</td>
													<td>
														<Badge
															label={
																booked
																	? "Terbooking"
																	: slot.enabled
																		? "Tersedia"
																		: "Nonaktif"
															}
															tone={
																booked ? "info" : slot.enabled ? "success" : ""
															}
														/>
													</td>
													<td>
														<div className="actions">
															<Button
																className="small"
																variant="neutral"
																onClick={edit}
																disabled={booked}
															>
																Edit
															</Button>
															<Button
																className="small"
																variant="secondary"
																onClick={toggle}
																disabled={booked}
															>
																{slot.enabled ? "Nonaktifkan" : "Aktifkan"}
															</Button>
															<Button
																className="small"
																variant="danger"
																onClick={remove}
																disabled={booked}
															>
																Hapus
															</Button>
														</div>
													</td>
												</tr>
											);
										},
									)}
								</tbody>
							</table>
						</div>
					) : (
						<EmptyState
							title="Belum ada slot"
							description="Bentuk slot otomatis atau tambahkan waktu secara manual."
							icon="calendar"
						/>
					)}
				</div>
			</Panel>
			<Modal
				open={generating}
				title="Pratinjau pembentukan slot"
				onClose={closeGeneration}
			>
				<div className="stack">
					<p>
						{mentor?.name} · {formatDate(date)} · {preview.length} kandidat
						sesi. Booking lama dan riwayat dipertahankan. Kandidat yang
						bertabrakan dengan booking akan dilewati.
					</p>
					<div className="slots">
						{preview.map(
							/** Menampilkan sesi dan jeda lengkap sebelum jadwal diterapkan. */
							function previewSlot(slot) {
								return (
									<div className="subtle-box" key={slot.start}>
										<strong>
											{slot.start}–{slot.sessionEnd}
										</strong>
										<small>Jeda sampai {slot.bufferEnd}</small>
									</div>
								);
							},
						)}
					</div>
					<div className="actions">
						<Button variant="neutral" onClick={closeGeneration}>
							Batal
						</Button>
						<Button onClick={generate}>Terapkan jadwal</Button>
					</div>
				</div>
			</Modal>
			<Modal
				open={editing !== null}
				title={editing ? "Edit slot kosong" : "Tambah slot"}
				onClose={closeEdit}
			>
				<form className="stack" onSubmit={saveSlot} key={editing}>
					<label className="field">
						Waktu mulai WIB
						<input
							name="start"
							type="time"
							required
							defaultValue={current?.start ?? state.settings.start}
							min={state.settings.start}
							max={state.settings.end}
						/>
					</label>
					<p className="helper">
						Sesi {state.settings.sessionMinutes} menit dan jeda{" "}
						{state.settings.bufferMinutes} menit. Slot tidak boleh bertabrakan.
					</p>
					<div className="actions">
						<Button variant="neutral" onClick={closeEdit}>
							Batal
						</Button>
						<Button type="submit">Simpan slot</Button>
					</div>
				</form>
			</Modal>
		</>
	);
}
registerDemoView("/admin/jadwal", SchedulesPage);
registerDemoView("/mentor/jadwal", SchedulesPage);
