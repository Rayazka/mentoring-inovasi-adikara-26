// TODO: Ulangi pengujian kapasitas dengan koneksi database paralel ketika adapter produksi tersedia.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { teamCommand } from "../src/controllers/demo/team-controller";

/** Membuktikan retry pembuatan tidak menciptakan dua tim untuk pengguna yang sama. */
it("mencegah dua tim aktif bagi pembuat yang sama", function createOnce() {
	const state = createDemoSeed();
	state.userId = "sinta";
	teamCommand(state, "team.create", {
		name: "Tim Baru",
		category: "UI/UX",
		description: "Menguji produk",
	});
	/** Mencoba kembali operasi setelah tim berhasil dibuat. */
	function duplicateCreate() {
		teamCommand(state, "team.create", {
			name: "Tim Lain",
			category: "UI/UX",
			description: "Percobaan ulang",
		});
	}
	expect(duplicateCreate).toThrow("sudah tergabung");
	expect(state.teams[2].memberIds).toEqual(["sinta"]);
});

/** Memastikan permintaan bukan keanggotaan dan persetujuan tetap memeriksa kursi terakhir. */
it("membatasi anggota termasuk ketua dan menolak persetujuan ulang", function capacityGuard() {
	const state = createDemoSeed();
	state.userId = "alya";
	teamCommand(state, "team.review", { joinId: "join-1", accept: true });
	expect(state.teams[0].memberIds).toHaveLength(3);
	/** Mencoba menyetujui permintaan yang telah selesai diproses. */
	function approveTwice() {
		teamCommand(state, "team.review", { joinId: "join-1", accept: true });
	}
	expect(approveTwice).toThrow("sudah diproses");
	state.joins.push({
		...state.joins[0],
		id: "join-2",
		userId: "bima",
		status: "pending",
	});
	/** Mencoba menerima peserta ketika kursi tim sudah habis. */
	function overCapacity() {
		teamCommand(state, "team.review", { joinId: "join-2", accept: true });
	}
	expect(overCapacity).toThrow("Tim penuh");
});

/** Memastikan anggota biasa tidak menerima permintaan atau meninggalkan tim tanpa ketua. */
it("melindungi kepemimpinan dan pemeriksaan pemilik tim", function ownershipGuard() {
	const state = createDemoSeed();
	state.userId = "rafi";
	/** Mencoba mengambil tindakan yang hanya tersedia untuk ketua. */
	function unauthorizedReview() {
		teamCommand(state, "team.review", { joinId: "join-1", accept: true });
	}
	expect(unauthorizedReview).toThrow("ketua");
	state.userId = "alya";
	/** Mencoba keluar sebelum kepemimpinan dialihkan. */
	function leaderLeave() {
		teamCommand(state, "team.leave", {});
	}
	expect(leaderLeave).toThrow("Alihkan");
	teamCommand(state, "team.transfer", { teamId: "team-1", userId: "rafi" });
	teamCommand(state, "team.leave", {});
	expect(state.teams[0].leaderId).toBe("rafi");
	expect(state.teams[0].memberIds).toEqual(["rafi"]);
});
