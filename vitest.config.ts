// TODO: Add separate database/browser test projects when those integrations are enabled.
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({ resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } }, test: { environment: "node" } });
