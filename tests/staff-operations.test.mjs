// TODO: Tambahkan skenario query saat sumber metrik operasional berkembang.
import { expect, it, vi } from "vitest";
vi.mock(
	"server-only",
	/** Mengisolasi modul repository dari batas runtime Next.js. */
	function mockServer() {
		return {};
	},
);
import { readStaffSummary } from "../src/models/connected/operations-repository";
import {
	parsePageFilters,
	totalRequests,
	formatWib,
} from "../src/models/connected/operations";
/** Membuat query yang meniru count pasti, terpisah dari hasil daftar terbatas. */
function fakeClient(failTable = "") {
	const calls = [];
	return {
		calls,
		from:
			/** Merekam tabel yang diminta agar akses audit mentor dapat diperiksa. */
			function from(table) {
				calls.push(table);
				let status = "";
				let head = false;
				const builder = {
					select:
						/** Memisahkan query hitungan dari query daftar. */
						function select(_columns, options) {
							head = Boolean(options?.head);
							return builder;
						},
					eq:
						/** Menyimpan status yang dihitung pada query pengajuan. */
						function eq(column, value) {
							if (column === "status") status = value;
							return builder;
						},
					is: chain,
					gte: chain,
					order: chain,
					limit: chain,
					range: chain,
					single:
						/** Menghasilkan pengaturan acara sintetis yang tidak memuat kredensial. */
						function single() {
							return Promise.resolve({
								data: {
									dates: ["2026-10-24"],
									day_start: "18:30:00",
									day_end: "22:00:00",
									session_minutes: 15,
									buffer_minutes: 5,
									discord_url: "https://discord.gg/example",
								},
								error: null,
							});
						},
					// biome-ignore lint/suspicious/noThenProperty: Meniru builder PostgREST yang sengaja bersifat thenable.
					then:
						/** Menghasilkan count di atas batas select untuk mendeteksi metrik yang terpotong. */
						function then(resolve, reject) {
							return Promise.resolve({
								data: head ? null : [],
								count:
									table === "mentoring_requests"
										? status === "pending"
											? 2001
											: 1
										: 9,
								error:
									table === failTable
										? { message: "private database error" }
										: null,
							}).then(resolve, reject);
						},
				};
				/** Mempertahankan builder untuk pengurutan, pembatasan dan filter nonstatus. */
				function chain() {
					return builder;
				}
				return builder;
			},
	};
}
/** Memastikan metrik tidak dihitung dari daftar terbaru yang hanya enam baris. */
it("menggunakan count pasti seluruh periode", async function exactCounts() {
	const client = fakeClient();
	const summary = await readStaffSummary(client, true);
	expect(summary.requests).toHaveLength(0);
	expect(summary.statuses.pending).toBe(2001);
	expect(totalRequests(summary)).toBe(2006);
	expect(client.calls).toContain("audit_events");
});
/** Menghindari permintaan audit administratif untuk akun mentor general. */
it("tidak membaca audit untuk mentor", async function noMentorAudit() {
	const client = fakeClient();
	await readStaffSummary(client, false);
	expect(client.calls).not.toContain("audit_events");
});
/** Menandai kegagalan query sebagai kegagalan, bukan hitungan nol palsu. */
it("tidak menyembunyikan error sebagai nol", async function rejectFailedCount() {
	await expect(readStaffSummary(fakeClient("teams"), true)).rejects.toThrow(
		"Data operasional belum berhasil dimuat",
	);
});
/** Menormalkan input URL dan waktu Jakarta sebelum dipakai view. */
it("membatasi filter dan menggunakan WIB", function safeFilters() {
	expect(
		parsePageFilters({ page: "-5", status: "admin", q: "  MT-1 " }),
	).toEqual({ page: 1, status: "", query: "MT-1" });
	expect(parsePageFilters({ page: "2", status: "pending" }).page).toBe(2);
	expect(formatWib("2026-10-24T11:30:00Z")).toContain("18.30");
});
