// TODO: Ulangi invariant request melalui dua transaksi database bersamaan pada tahap produksi.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import {
	assertRequestCapacity,
	availableRequestSlot,
	requestForActor,
	transitionRequest,
} from "../src/models/demo/request-policy";

/** Memastikan status akhir tidak dapat disetujui ulang dan pending tidak memesan slot. */
it("memvalidasi transisi dan membedakan pengajuan dengan booking", function requestTransitions() {
	const state = createDemoSeed();
	const request = state.requests[0];
	expect(availableRequestSlot(state, request.slotId, request.mentorId).id).toBe(
		request.slotId,
	);
	transitionRequest(request, "rejected");
	/** Mencoba menyetujui ulang pengajuan yang sudah ditolak. */
	function resurrectRequest() {
		transitionRequest(request, "approved");
	}
	expect(resurrectRequest).toThrow("tidak dapat");
});

/** Memastikan tim lain tidak dapat membaca pengajuan dan tim pemilik terikat batas request aktif. */
it("menerapkan kepemilikan dan batas request aktif", function requestOwnership() {
	const state = createDemoSeed();
	state.userId = "bima";
	/** Mencoba membuka pengajuan tim lain melalui ID langsung. */
	function foreignRequest() {
		requestForActor(state, "MT-026");
	}
	expect(foreignRequest).toThrow("tidak dapat mengakses");
	state.userId = "alya";
	expect(requestForActor(state, "MT-026").teamId).toBe("team-1");
	/** Mencoba menambah pengajuan ketika tim masih menunggu respons. */
	function capacityExceeded() {
		assertRequestCapacity(state, "team-1");
	}
	expect(capacityExceeded).toThrow("masih memiliki");
});
