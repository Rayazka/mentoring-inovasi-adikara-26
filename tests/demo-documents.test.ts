// TODO: Ulangi pengujian izin ini dengan JWT dan objek Storage pada lingkungan produksi.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { documentCommand } from "../src/controllers/demo/document-controller";
import { requireDocumentAccess } from "../src/controllers/demo/document-access";

/** Memastikan dokumen hanya terlihat bagi tim dan mentor yang terkait tanpa akses admin otomatis. */
it("membatasi akses berkas dan mempertahankan referensi riwayat", function documentAuthorization() {
	const state = createDemoSeed();
	state.userId = "alya";
	documentCommand(state, "document.upload", {
		id: "file-1",
		filename: "proposal.pdf",
		bytes: 1024,
		title: "Proposal",
	});
	expect(requireDocumentAccess(state, "file-1").title).toBe("Proposal");
	state.userId = "user-mentor-1";
	expect(requireDocumentAccess(state, "file-1").teamId).toBe("team-1");
	state.userId = "bima";
	/** Mencoba mengakses berkas dari tim lain. */
	function foreignAccess() {
		requireDocumentAccess(state, "file-1");
	}
	expect(foreignAccess).toThrow("tidak memiliki akses");
	state.userId = "alya";
	state.requests[0].documentIds = ["file-1"];
	documentCommand(state, "document.delete", { id: "file-1" });
	expect(state.requests[0].documentIds).toEqual(["file-1"]);
	expect(state.documents).toHaveLength(0);
});

/** Memastikan kuota ukuran dan klik ulang tidak menduplikasi metadata unggahan. */
it("menolak metadata berlebih dan file ganda", function uploadLimits() {
	const state = createDemoSeed();
	state.userId = "alya";
	documentCommand(state, "document.upload", {
		id: "file-1",
		filename: "a.pdf",
		bytes: 1024,
		title: "Bahan",
	});
	/** Mengirim ulang file dengan nama dan ukuran sama. */
	function duplicate() {
		documentCommand(state, "document.upload", {
			id: "file-2",
			filename: "a.pdf",
			bytes: 1024,
			title: "Bahan",
		});
	}
	expect(duplicate).toThrow("sudah tersimpan");
	/** Mencoba mengunggah metadata berukuran di luar batas. */
	function tooLarge() {
		documentCommand(state, "document.upload", {
			id: "large",
			filename: "b.pdf",
			bytes: 20 * 1024 * 1024,
			title: "Besar",
		});
	}
	expect(tooLarge).toThrow("Ukuran");
});
