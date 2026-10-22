// TODO: Bangun ulang paket SQL Editor setiap kali migrasi rilis berubah.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const foundation = (
	await readFile(
		resolve(root, "migrations/202610210001_auth_foundation.sql"),
		"utf8",
	)
)
	.replaceAll("\r\n", "\n")
	.replace(/^begin;\n/m, "")
	.replace(/^commit;\s*$/m, "");
const files = [
	"202610220001_release_core.sql",
	"202610220002_release_commands.sql",
];
let sql = `-- TODO: Gunakan sekali pada project yang sudah dibackup; jangan jalankan berkas uji pada produksi.
-- Paket ini dihasilkan oleh supabase/scripts/build-sql-editor.mjs.
-- Fondasi dilewati bila public.profiles sudah tersedia dari migrasi awal project ini.
do $bootstrap$
begin
  if to_regclass('public.profiles') is null then
${foundation}
  end if;
end $bootstrap$;
`;
for (const file of files)
	sql += `\n-- Sumber: ${file}\n${(await readFile(resolve(root, "migrations", file), "utf8")).replaceAll("\r\n", "\n")}\n`;
await mkdir(resolve(root, "sql"), { recursive: true });
await writeFile(resolve(root, "sql/00_install.sql"), sql, "utf8");
process.stdout.write("Paket SQL Editor selesai dibuat.\n");
