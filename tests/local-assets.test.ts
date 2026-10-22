// TODO: Pertahankan pengujian batas publikasi saat menambah whitelist aset lokal.
import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(
	/** Mengganti pembacaan aset privat dengan byte sintetis. */
	function createMocks() {
		return { readFile: vi.fn() };
	},
);
vi.mock(
	"node:fs/promises",
	/** Mencegah pengujian mengakses dokumen atau aset asli. */
	function mockFiles() {
		return { readFile: mocks.readFile };
	},
);
import { GET } from "../src/app/api/demo-assets/[asset]/route";
/** Mengembalikan environment dan mock setelah setiap skenario. */
afterEach(function cleanup() {
	vi.unstubAllEnvs();
	vi.clearAllMocks();
});
/** Membuat permintaan adapter untuk satu nama aset. */
function request(asset: string) {
	return GET(new Request("http://localhost:3000/api/demo-assets/test"), {
		params: Promise.resolve({ asset }),
	});
}
/** Memastikan pengaktifan Supabase tidak mematikan pratinjau aset lokal. */
it("menyajikan aset whitelist saat development terhubung", async function connectedPreview() {
	vi.stubEnv("NODE_ENV", "development");
	vi.stubEnv("NEXT_PUBLIC_APP_MODE", "connected");
	mocks.readFile.mockResolvedValue(Buffer.from("synthetic-image"));
	const response = await request("login-pattern");
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toBe("image/png");
});
/** Melarang pembacaan file privat pada server production. */
it("memblokir aset lokal pada production", async function blockProduction() {
	vi.stubEnv("NODE_ENV", "production");
	expect((await request("login-pattern")).status).toBe(404);
	expect(mocks.readFile).not.toHaveBeenCalled();
});
/** Menolak nama aset di luar whitelist sebelum membaca filesystem. */
it("menolak traversal dan dokumen privat", async function restrictFiles() {
	vi.stubEnv("NODE_ENV", "development");
	for (const asset of ["../../.env.local", "design.pen", "prd.pdf"])
		expect((await request(asset)).status).toBe(404);
	expect(mocks.readFile).not.toHaveBeenCalled();
});
