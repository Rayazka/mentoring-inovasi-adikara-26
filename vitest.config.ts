// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
	resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
	test: { environment: "node" },
});
