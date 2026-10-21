// TODO: Pindahkan invariant tim ke transaksi database saat integrasi produksi dimulai.
import type { DemoState } from "@/models/demo/types";
import {
	actorTeam,
	audit,
	newId,
	notify,
	requireActor,
	requireLeader,
	requiredText,
} from "./context";
import { textValue, type CommandPayload } from "./session-controller";

/** Menolak perubahan tim ketika peserta belum masuk atau memiliki peran lain. */
function participant(state: DemoState) {
	const actor = requireActor(state);
	if (actor.role !== "participant")
		throw new Error("Pengelolaan tim hanya tersedia untuk peserta.");
	return actor;
}

/** Membuat satu tim baru dan menempatkan pembuat sebagai ketua sekaligus anggota. */
function createTeam(state: DemoState, payload: CommandPayload) {
	const actor = participant(state);
	if (actorTeam(state))
		throw new Error(
			"Kamu sudah tergabung dalam tim. Keluar terlebih dahulu untuk membuat tim baru.",
		);
	const name = requiredText(textValue(payload, "name"), "Nama tim", 80);
	const category = requiredText(textValue(payload, "category"), "Kategori", 40);
	const description = requiredText(
		textValue(payload, "description"),
		"Deskripsi tim",
		500,
	);
	const duplicate = state.teams.some(
		/** Mencegah nama tim yang sama setelah normalisasi kapital dan spasi. */
		function sameName(team) {
			return (
				team.name.toLocaleLowerCase("id-ID") === name.toLocaleLowerCase("id-ID")
			);
		},
	);
	if (duplicate) throw new Error("Nama tim sudah digunakan.");
	const id = newId("team");
	state.teams.push({
		id,
		name,
		category,
		description,
		leaderId: actor.id,
		memberIds: [actor.id],
	});
	for (const join of state.joins)
		if (join.userId === actor.id && join.status === "pending")
			join.status = "rejected";
	audit(state, "Tim dibuat", id, name);
	return "Tim berhasil dibuat. Kamu menjadi ketua tim.";
}

/** Mengirim permintaan bergabung tanpa langsung memberikan akses data privat tim. */
function requestJoin(state: DemoState, payload: CommandPayload) {
	const actor = participant(state);
	if (actorTeam(state))
		throw new Error("Kamu hanya dapat bergabung dalam satu tim.");
	const teamId = textValue(payload, "teamId");
	const team = state.teams.find(
		/** Mencari tim tujuan permintaan peserta. */
		function targetTeam(item) {
			return item.id === teamId;
		},
	);
	if (!team) throw new Error("Tim tidak ditemukan.");
	if (team.memberIds.length >= 3)
		throw new Error("Tim sudah penuh, maksimal tiga anggota.");
	if (
		state.joins.some(
			/** Menolak permintaan ganda yang masih menunggu jawaban. */
			function existingJoin(item) {
				return (
					item.teamId === teamId &&
					item.userId === actor.id &&
					item.status === "pending"
				);
			},
		)
	)
		throw new Error("Permintaan bergabung masih menunggu respons ketua.");
	const note = requiredText(
		textValue(payload, "note"),
		"Pesan perkenalan",
		500,
	);
	state.joins.push({
		id: newId("join"),
		teamId,
		userId: actor.id,
		note,
		status: "pending",
		createdAt: new Date().toISOString(),
	});
	notify(
		state,
		team.leaderId,
		`${actor.name} ingin bergabung dengan timmu`,
		"/peserta/tim",
	);
	audit(state, "Permintaan bergabung", teamId);
	return "Permintaan terkirim. Tunggu persetujuan ketua tim.";
}

/** Memeriksa ulang kapasitas dan keanggotaan sebelum ketua menerima calon anggota. */
function reviewJoin(state: DemoState, payload: CommandPayload) {
	participant(state);
	const joinId = textValue(payload, "joinId");
	const join = state.joins.find(
		/** Memilih permintaan yang sedang ditinjau ketua. */
		function targetJoin(item) {
			return item.id === joinId;
		},
	);
	if (!join || join.status !== "pending")
		throw new Error("Permintaan sudah diproses atau tidak ditemukan.");
	const team = requireLeader(state, join.teamId);
	const accepted = payload.accept === true;
	if (accepted) {
		if (team.memberIds.length >= 3)
			throw new Error("Tim penuh. Anggota maksimal tiga orang termasuk ketua.");
		if (
			state.teams.some(
				/** Memastikan calon anggota belum diterima oleh tim lain. */
				function alreadyMember(item) {
					return item.memberIds.includes(join.userId);
				},
			)
		)
			throw new Error("Peserta sudah bergabung dengan tim lain.");
		team.memberIds.push(join.userId);
		for (const other of state.joins)
			if (
				other.userId === join.userId &&
				other.id !== join.id &&
				other.status === "pending"
			)
				other.status = "rejected";
	}
	join.status = accepted ? "accepted" : "rejected";
	notify(
		state,
		join.userId,
		`Permintaan bergabung ${accepted ? "diterima" : "ditolak"} oleh ${team.name}`,
		"/peserta/tim",
	);
	audit(
		state,
		accepted ? "Anggota diterima" : "Permintaan ditolak",
		team.id,
		join.userId,
	);
	return accepted
		? "Anggota berhasil ditambahkan ke tim."
		: "Permintaan bergabung ditolak.";
}

/** Memindahkan kepemimpinan hanya kepada anggota aktif tim yang sama. */
function transferLeadership(state: DemoState, payload: CommandPayload) {
	participant(state);
	const team = requireLeader(state, textValue(payload, "teamId"));
	const targetId = textValue(payload, "userId");
	if (!team.memberIds.includes(targetId) || targetId === team.leaderId)
		throw new Error("Pilih anggota aktif selain ketua saat ini.");
	team.leaderId = targetId;
	notify(state, targetId, `Kamu menjadi ketua ${team.name}`, "/peserta/tim");
	audit(state, "Ketua dialihkan", team.id, targetId);
	return "Kepemimpinan tim berhasil dialihkan.";
}

/** Mengeluarkan anggota tanpa meninggalkan tim yang masih memiliki pengajuan aktif tanpa pengelola. */
function leaveTeam(state: DemoState) {
	const actor = participant(state);
	const team = actorTeam(state);
	if (!team) throw new Error("Kamu belum memiliki tim.");
	if (team.leaderId === actor.id && team.memberIds.length > 1)
		throw new Error("Alihkan ketua terlebih dahulu sebelum keluar dari tim.");
	if (team.memberIds.length === 1) {
		if (
			state.requests.some(
				/** Mempertahankan tim yang masih memiliki sesi atau pengajuan berjalan. */
				function activeRequest(item) {
					return (
						item.teamId === team.id &&
						["pending", "revision_requested", "approved"].includes(item.status)
					);
				},
			)
		)
			throw new Error(
				"Selesaikan atau batalkan pengajuan aktif sebelum membubarkan tim.",
			);
		state.teams = state.teams.filter(
			/** Menghapus tim kosong setelah semua kegiatan aktif ditutup. */
			function remainingTeam(item) {
				return item.id !== team.id;
			},
		);
		for (const join of state.joins)
			if (join.teamId === team.id && join.status === "pending")
				join.status = "rejected";
	} else {
		team.memberIds = team.memberIds.filter(
			/** Menghapus hanya anggota yang sedang keluar. */
			function remainingMember(id) {
				return id !== actor.id;
			},
		);
		notify(
			state,
			team.leaderId,
			`${actor.name} keluar dari tim`,
			"/peserta/tim",
		);
	}
	audit(state, "Keluar dari tim", team.id);
	return "Kamu sudah keluar dari tim.";
}

/** Mengarahkan tindakan tim melalui invariant model yang berlaku pada seluruh view demo. */
export function teamCommand(
	state: DemoState,
	action: string,
	payload: CommandPayload,
) {
	switch (action) {
		case "team.create":
			return createTeam(state, payload);
		case "team.join":
			return requestJoin(state, payload);
		case "team.review":
			return reviewJoin(state, payload);
		case "team.transfer":
			return transferLeadership(state, payload);
		case "team.leave":
			return leaveTeam(state);
		default:
			throw new Error("Tindakan tim tidak dikenali.");
	}
}
