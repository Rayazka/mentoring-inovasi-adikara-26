// TODO: Buktikan perpindahan slot atomik dengan race database ketika integrasi produksi tersedia.
import { expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { rescheduleCommand } from "../src/controllers/demo/reschedule-controller";

/** Memastikan penolakan usulan mempertahankan booking dan tautan meeting lama. */
it("mempertahankan booking lama ketika usulan ditolak", function rejectChange() {
	const state = createDemoSeed();
	const request = state.requests[0];
	request.status = "approved";
	request.meetingUrl = "https://example.com/meeting";
	const original = request.slotId;
	state.userId = "user-mentor-1";
	rescheduleCommand(state, "reschedule.propose", {
		id: request.id,
		slotId: "mentor-1-2026-10-24-19:30",
		note: "Penyesuaian agenda",
	});
	/** Mencoba menyetujui usulan sendiri tanpa pihak lawan. */
	function selfApproval() {
		rescheduleCommand(state, "reschedule.respond", {
			id: request.id,
			accept: true,
		});
	}
	expect(selfApproval).toThrow("pembuatnya");
	state.userId = "alya";
	rescheduleCommand(state, "reschedule.respond", {
		id: request.id,
		accept: false,
	});
	expect(request.slotId).toBe(original);
	expect(request.meetingUrl).toBe("https://example.com/meeting");
	expect(request.change).toBeUndefined();
});

/** Memastikan slot target yang baru saja terbooking tidak menggusur reservasi lama. */
it("memvalidasi ulang slot target sebelum perubahan disepakati", function stolenTarget() {
	const state = createDemoSeed();
	const request = state.requests[0];
	request.status = "approved";
	const old = request.slotId;
	state.userId = "user-mentor-1";
	rescheduleCommand(state, "reschedule.propose", {
		id: request.id,
		slotId: "mentor-1-2026-10-24-19:30",
		note: "Agenda berubah",
	});
	state.requests.push({
		...structuredClone(request),
		id: "MT-other",
		teamId: "team-2",
		slotId: "mentor-1-2026-10-24-19:30",
		change: undefined,
	});
	state.userId = "alya";
	/** Mencoba menerima usulan setelah slot dipesan pengajuan lain. */
	function confirmUnavailable() {
		rescheduleCommand(state, "reschedule.respond", {
			id: request.id,
			accept: true,
		});
	}
	expect(confirmUnavailable).toThrow("terbooking");
	expect(request.slotId).toBe(old);
	expect(request.status).toBe("approved");
});
