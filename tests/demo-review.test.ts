// TODO: Ulangi persaingan persetujuan dengan transaksi bersamaan lintas koneksi pada produksi.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { reviewCommand } from "../src/controllers/demo/review-controller";
import { requestCommand } from "../src/controllers/demo/request-controller";

/** Membuktikan satu slot hanya disetujui sekali dan pengajuan lain diarahkan ke revisi jadwal. */
it("melindungi slot yang telah disetujui", function competingApprovals() {
	const state = createDemoSeed();
	state.userId = "user-mentor-1";
	state.requests.push({
		...structuredClone(state.requests[0]),
		id: "MT-lain",
		teamId: "team-2",
	});
	reviewCommand(state, "review.approve", {
		id: "MT-026",
		meetingUrl: "https://meet.google.com/demo-room",
		note: "Sampai bertemu",
	});
	expect(state.requests[0].status).toBe("approved");
	expect(state.requests[1].status).toBe("revision_requested");
	/** Mencoba menyetujui pengajuan yang telah kehilangan slot. */
	function secondApproval() {
		reviewCommand(state, "review.approve", {
			id: "MT-lain",
			meetingUrl: "https://meet.google.com/other-room",
		});
	}
	expect(secondApproval).toThrow("mengirim ulang");
});

/** Membuktikan keputusan memerlukan mentor terkait dan URL meeting yang aman. */
it("menolak keputusan mentor lain dan URL berbahaya", function reviewAuthorization() {
	const state = createDemoSeed();
	state.userId = "user-mentor-2";
	/** Mencoba memberikan keputusan pada tim yang tidak mengajukan ke mentor ini. */
	function foreignApproval() {
		reviewCommand(state, "review.approve", {
			id: "MT-026",
			meetingUrl: "https://example.com",
		});
	}
	expect(foreignApproval).toThrow();
	state.userId = "user-mentor-1";
	/** Mencoba menyimpan link ruang mentoring yang dapat menjalankan kode. */
	function unsafeMeeting() {
		reviewCommand(state, "review.approve", {
			id: "MT-026",
			meetingUrl: "javascript:alert(1)",
		});
	}
	expect(unsafeMeeting).toThrow();
	expect(state.requests[0].status).toBe("pending");
});

/** Memastikan retry submit tidak menciptakan duplikasi dan perubahan karya tidak mengubah snapshot. */
it("menjaga snapshot dan idempotensi formulir", function submitSnapshot() {
	const state = createDemoSeed();
	state.userId = "bima";
	const payload = {
		mentorId: "mentor-2",
		slotId: "mentor-2-2026-10-24-18:30",
		submissionKey: "test-retry",
	};
	requestCommand(state, "request.submit", payload);
	const title = state.requests[0].title;
	state.works[1].title = "Judul berubah setelah submit";
	requestCommand(state, "request.submit", payload);
	expect(state.requests).toHaveLength(2);
	expect(state.requests[0].title).toBe(title);
});
