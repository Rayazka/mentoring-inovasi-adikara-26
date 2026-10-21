import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { repository, stages, decisions, tasks, allItems, validateBacklog } from "./backlog.mjs";

const root = process.cwd();
const output = path.join(root, "docs", "github");
const temporary = path.join(root, "tmp", "github-backlog");
fs.mkdirSync(output, { recursive: true });
fs.mkdirSync(temporary, { recursive: true });
const mapPath = path.join(output, "issue-map.json");
const state = fs.existsSync(mapPath) ? JSON.parse(fs.readFileSync(mapPath, "utf8")) : {
  repository, issues: {}, milestones: {}, parents: [], dependencies: [],
};
if (state.repository !== repository) throw new Error("Repository mismatch in issue journal");
const summary = validateBacklog();
const applying = process.argv.includes("--apply");
const verifying = process.argv.includes("--verify");
const base = `repos/${repository}`;
const web = `https://github.com/${repository}`;
const checkpoint = () => fs.writeFileSync(mapPath, `${JSON.stringify(state, null, 2)}\n`);
const pause = () => new Promise((resolve) => setTimeout(resolve, 900));
let payloadIndex = 0;

function api(endpoint, method = "GET", data, allowMissing = false) {
  const args = ["api", endpoint, "--method", method, "-H", "Accept: application/vnd.github+json"];
  if (data !== undefined) {
    const filename = path.join(temporary, `payload-${++payloadIndex}.json`);
    fs.writeFileSync(filename, JSON.stringify(data));
    args.push("--input", filename);
  }
  const result = spawnSync("gh", args, { encoding: "utf8", timeout: 60_000, windowsHide: true });
  if (allowMissing && result.status !== 0 && /HTTP 404/.test(result.stderr || "")) return null;
  if (result.error || result.status !== 0) {
    throw new Error(`GitHub ${method} ${endpoint}: ${result.stderr || result.error?.message}`);
  }
  return result.stdout.trim() ? JSON.parse(result.stdout) : null;
}

async function writeApi(endpoint, method, data) {
  const result = api(endpoint, method, data);
  await pause();
  return result;
}

function list(endpoint) {
  const items = [];
  for (let page = 1; ; page++) {
    const batch = api(`${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

function reference(id) {
  const item = state.issues[id];
  return item ? `#${item.number}` : `\`${id}\``;
}

function references() {
  return `## Referensi dan batas publikasi\n\nCakupan issue ini diturunkan dari PRD, development plan dan desain terbaru yang disimpan privat oleh pemilik project. Dokumen sumber, canvas/PDF, foto dan aset tidak dipublikasikan pada repo ini; minta akses terpisah kepada pemilik bila diperlukan.\n\nFrame ID hanya penunjuk pada canvas privat, bukan endpoint atau tautan publik. Acceptance criteria issue menjadi acuan kerja publik; instruksi terbaru pemilik dan keputusan produk yang tercatat mengungguli fixture atau copy desain lama.\n`;
}

function itemBody(item) {
  const deps = item.dependencies.length ? item.dependencies.map((id) => `- ${reference(id)} — ${id}`).join("\n") : "- Tidak ada dependensi issue lain; ikuti referensi dan keputusan produk yang relevan.";
  const framing = item.kind === "decision"
    ? "Keputusan ini masih terbuka. Pilihan/usulan pada PRD atau mockup tidak otomatis menjadi persetujuan pemilik produk."
    : "Implementasikan hasil yang dapat digunakan dan diuji, bukan sekadar komponen atau placeholder. Kode fondasi yang sudah tersedia tetap perlu ditinjau dan diintegrasikan.";
  return `<!-- backlog-id: ${item.id} -->\n\n## Tujuan\n\n${item.title}.\n\n${framing}\n\nEpic: ${reference(`EPIC-${item.stage}`)} · Tahap ${item.stage} · Prioritas ${item.priority}.\n\n## Cakupan${item.kind === "decision" ? " keputusan" : ""}\n\n${item.scope.map((s) => `- ${s}`).join("\n")}\n\n## Acceptance criteria\n\n${item.acceptance.map((s) => `- [ ] ${s}`).join("\n")}\n\n## Validasi / bukti penyelesaian\n\n${item.verification.map((s) => `- ${s}`).join("\n")}\n\n## Dependensi\n\n${deps}\n\n${item.frames.length ? `## Referensi frame\n\n${item.frames.map((s) => `\`${s}\``).join(", ")} pada canvas.\n\n` : ""}${references()}\n## Definition of done\n\n${item.kind === "decision" ? "Keputusan pemilik produk tercatat, dampak pada spesifikasi/issue terkait diperbarui, dan alternatif yang ditolak jelas." : "Acceptance criteria dan validasi di atas terpenuhi; kondisi kosong/loading/gagal dan otorisasi yang relevan tersedia. Lampirkan bukti nyata di PR. Gunakan Closes hanya bila seluruh lingkup selesai; gunakan Refs untuk pekerjaan parsial. Jangan commit secret, kontak privat, atau data peserta nyata."}\n`;
}

function epicBody(stage) {
  const children = allItems.filter((item) => item.stage === stage.id);
  return `<!-- backlog-id: EPIC-${stage.id} -->\n\n## Hasil tahap\n\n${stage.outcome}\n\nBagian dari roadmap ${reference("ROADMAP")}. Epic ini pelacak, bukan satu PR besar.\n\n## Issues\n\n${children.map((item) => `- [ ] ${reference(item.id)} — ${item.id}: ${item.title}`).join("\n")}\n\n## Gerbang selesai\n\n- [ ] Seluruh issue dalam scope tahap memiliki bukti penerimaan.\n- [ ] Keputusan yang menghalangi modul telah ditetapkan; asumsi tidak diperlakukan sebagai konfirmasi.\n- [ ] UI, server/database, kondisi gagal dan pengujian terintegrasi.\n- [ ] Status implementasi dan handoff diperbarui.\n\n${stage.id === "FUTURE" ? "Fitur tahap ini bukan komitmen rilis acara; keputusan scope dan desain diperlukan sebelum implementasi.\n\n" : "Tanggal kegiatan tidak menjadi alasan menutup epic tanpa pemeriksaan. Perubahan lingkup eksplisit perlu persetujuan produk.\n\n"}${references()}`;
}

function roadmapBody() {
  return `<!-- backlog-id: ROADMAP -->\n\n## Development by issues\n\nBangun Mentoring ADIKARA 2026 dengan Next.js + TypeScript serta Supabase. Repo saat awal berisi fondasi autentikasi/role, migrasi profil dan helper jadwal; belum aplikasi lengkap. Google OAuth/RLS nyata belum diverifikasi.\n\n## Urutan epic\n\n${stages.map((stage) => `- [ ] ${reference(`EPIC-${stage.id}`)} — ${stage.id}: ${stage.title}`).join("\n")}\n\n## Cara memilih pekerjaan\n\n1. Selesaikan keputusan sebelum modul yang terdampak; mulai penyelarasan desain dan setup Supabase.\n2. Pilih task P0 yang seluruh blocked-by-nya sudah selesai; epic bukan satu unit implementasi.\n3. Buat branch feat/<nomor>-<ringkasan> dan PR yang menyebut issue.\n4. Tutup task hanya setelah acceptance criteria, integrasi dan validasi terpenuhi.\n5. Rilis produksi melalui QA/UAT, bukan otomatis berdasarkan tanggal.\n\n## Invariant produk\n\n- Google-only, empat sisi aplikasi, role ditetapkan secara terkontrol.\n- Tim maksimal tiga termasuk ketua. Identitas Karya menyimpan judul/deskripsi dan dokumen tim.\n- Home mempertahankan container per menu dan CTA langsung pengisian saat kosong.\n- Mentoring 24–25 Oktober 2026; jam default 18.30–22.00 WIB dapat diedit admin. Sesi 15 menit + buffer 5; 10 slot utuh/hari/mentor jika tersedia penuh.\n- Admin CRUD mentor dan jadwal; Emirsyah hanya 24 Oktober; riwayat tidak dihapus saat arsip.\n- Booking dan batas kapasitas dijamin database; dokumen/kontak privat tidak bocor.\n\n## Keputusan produk\n\n${decisions.map((item) => `- ${reference(item.id)} — ${item.title}`).join("\n")}\n\n## Rilis\n\nTanggal acara 24 Oktober adalah target evaluasi kesiapan, bukan janji seluruh fitur selesai. FUTURE ditunda sampai inti stabil. Tidak ada assignee atau due date otomatis yang mengatasnamakan komitmen seseorang.\n\n${references()}\nPanduan kontribusi: [CONTRIBUTING.md](${web}/blob/main/CONTRIBUTING.md).`;
}

function writeIndex() {
  const rows = allItems.map((item) => `| ${item.id} | ${state.issues[item.id] ? `[${reference(item.id)}](${state.issues[item.id].url})` : "Belum dipublikasikan"} | ${item.stage} | ${item.kind} | ${item.priority} | ${item.title} |`);
  const epicRows = stages.map((stage) => `| ${stage.id} | ${reference(`EPIC-${stage.id}`)} | ${stage.title} |`);
  const content = `# GitHub Backlog — ADIKARA 2026\n\nRepo: [${repository}](${web}).\n\nRoadmap: ${reference("ROADMAP")}. ${summary.total} issues: 1 roadmap, ${stages.length} epic, ${tasks.length} task, ${decisions.length} keputusan. Semua dibuat open; fondasi kode bukan bukti fitur sudah selesai.\n\n## Epic dan milestone\n\n| Tahap | Epic | Hasil |\n| --- | --- | --- |\n${epicRows.join("\n")}\n\n## Issues\n\n| ID stabil | GitHub | Tahap | Jenis | Prioritas | Judul |\n| --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n\n## Alur kerja\n\nIkuti CONTRIBUTING.md. Gunakan issue yang dependensinya sudah selesai, implementasikan acceptance criteria, lalu buat PR. Keputusan produk tetap terbuka sampai dijawab pemilik produk. P2 belum dijadwalkan untuk rilis acara.\n\n## Sumber dan pemeliharaan\n\n- Manifest terstruktur: scripts/github/backlog.mjs.\n- Peta nomor/URL dan checkpoint publikasi: docs/github/issue-map.json.\n- Pemeriksaan lokal: node scripts/github/backlog.mjs --validate.\n- Preview indeks: node scripts/github/publish-backlog.mjs (tanpa mutasi GitHub).\n- Publikasi/resume: node scripts/github/publish-backlog.mjs --apply.\n- Verifikasi remote: node scripts/github/publish-backlog.mjs --verify.\n\nScript memakai ID stabil dan checkpoint. Ia tidak menutup issue atau menetapkan assignee/deadline. Jangan gunakan ulang untuk menimpa checklist epic yang sudah dikerjakan; tinjau perubahan terlebih dahulu.\n\nPRD, planning internal, desain, foto, seluruh aset sumber dan data mentor tetap privat/lokal. Repo hanya memuat kode dan workflow issues sesuai izin pemilik. Kontributor membutuhkan akses sumber terpisah untuk pekerjaan yang bergantung padanya.\n`;
  fs.writeFileSync(path.join(root, "docs", "GitHub Backlog.md"), content);
}

async function ensureIssue(key, title, body, labels, stage) {
  if (state.issues[key]) return state.issues[key];
  const result = await writeApi(`${base}/issues`, "POST", {
    title, body, labels,
    ...(stage ? { milestone: state.milestones[stage] } : {}),
  });
  state.issues[key] = { number: result.number, id: result.id, url: result.html_url, title };
  checkpoint();
  console.log(`Created ${key}: #${result.number}`);
  return state.issues[key];
}

async function publish() {
  console.log(`Preparing ${summary.total} issues for ${repository}`);
  const existing = list(`${base}/issues?state=all`).filter((issue) => !issue.pull_request);
  for (const issue of existing) {
    const key = issue.body?.match(/<!-- backlog-id: ([A-Z0-9-]+) -->/)?.[1];
    if (key) state.issues[key] = { number: issue.number, id: issue.id, url: issue.html_url, title: issue.title };
  }
  checkpoint();

  const definitions = [
    ["type:roadmap", "5319e7", "Pelacak pengembangan keseluruhan"],
    ["type:epic", "7057ff", "Kelompok pekerjaan satu tahap"],
    ["type:task", "0075ca", "Unit implementasi dengan acceptance criteria"],
    ["type:decision", "d876e3", "Keputusan produk yang belum final"],
    ["priority:P0", "b60205", "Alur inti dan pengujian rilis"],
    ["priority:P1", "fbca04", "Penyempurnaan operasional"],
    ["priority:P2", "c5def5", "Pengembangan lanjutan setelah inti stabil"],
    ["status:needs-decision", "e4e669", "Memerlukan keputusan pemilik produk"],
    ["scope:core", "0e8a16", "Cakupan inti aplikasi"],
    ["scope:future", "bfdadc", "Belum dijadwalkan untuk rilis acara"],
    ...[...new Set(allItems.map((item) => item.area))].map((area) => [`area:${area}`, "1d76db", `Area ${area}`]),
  ];
  const existingLabels = new Set(list(`${base}/labels`).map((label) => label.name));
  for (const [name, color, description] of definitions) {
    if (!existingLabels.has(name)) await writeApi(`${base}/labels`, "POST", { name, color, description });
  }
  console.log(`Labels ready (${definitions.length} managed)`);

  const existingMilestones = list(`${base}/milestones?state=all`);
  for (const stage of stages) {
    const title = `${stage.id} — ${stage.title}`;
    let milestone = existingMilestones.find((item) => item.title === title);
    if (!milestone) milestone = await writeApi(`${base}/milestones`, "POST", { title, description: stage.outcome });
    state.milestones[stage.id] = milestone.number;
    checkpoint();
  }
  console.log("Milestones ready");

  await ensureIssue("ROADMAP", "[ROADMAP] Development Mentoring ADIKARA 2026 — dev by issues", roadmapBody(), ["type:roadmap", "priority:P0", "scope:core"]);
  for (const stage of stages) {
    await ensureIssue(`EPIC-${stage.id}`, `[EPIC ${stage.id}] ${stage.title}`, epicBody(stage), ["type:epic", stage.id === "FUTURE" ? "priority:P2" : "priority:P0", stage.id === "FUTURE" ? "scope:future" : "scope:core"], stage.id);
  }
  // Decisions precede dependent tasks. Stable dependency IDs are topologically sorted.
  for (const item of allItems) {
    for (const dependency of item.dependencies) {
      if (!state.issues[dependency]) throw new Error(`Create dependency ${dependency} before ${item.id}`);
    }
    await ensureIssue(item.id, `[${item.id}] ${item.title}`, itemBody(item), [
      `type:${item.kind}`, `priority:${item.priority}`, `area:${item.area}`,
      item.stage === "FUTURE" ? "scope:future" : "scope:core",
      ...(item.kind === "decision" ? ["status:needs-decision"] : []),
    ], item.stage);
  }

  // Only update generated tracker bodies during initial publication/resume.
  if (!state.trackersFinalized) {
    for (const stage of stages) await writeApi(`${base}/issues/${state.issues[`EPIC-${stage.id}`].number}`, "PATCH", { body: epicBody(stage) });
    await writeApi(`${base}/issues/${state.issues.ROADMAP.number}`, "PATCH", { body: roadmapBody() });
    state.trackersFinalized = true;
    checkpoint();
  }
  console.log("All issues created; linking native hierarchy");

  const parentPairs = [
    ...stages.map((stage) => ["ROADMAP", `EPIC-${stage.id}`]),
    ...allItems.map((item) => [`EPIC-${item.stage}`, item.id]),
  ];
  for (const [parent, child] of parentPairs) {
    const relation = `${parent}>${child}`;
    if (state.parents.includes(relation)) continue;
    const currentParent = api(`${base}/issues/${state.issues[child].number}/parent`, "GET", undefined, true);
    if (currentParent?.id !== state.issues[parent].id) {
      if (currentParent?.id) throw new Error(`${child} already has another parent; refusing to replace it`);
      await writeApi(`${base}/issues/${state.issues[parent].number}/sub_issues`, "POST", { sub_issue_id: state.issues[child].id });
    }
    state.parents.push(relation);
    checkpoint();
    if (state.parents.length % 10 === 0) console.log(`Hierarchy links ${state.parents.length}/${parentPairs.length}`);
  }

  console.log("Linking native blocked-by dependencies");
  for (const item of allItems) {
    const missing = item.dependencies.filter((dep) => !state.dependencies.includes(`${item.id}<${dep}`));
    if (!missing.length) continue;
    const existingDeps = list(`${base}/issues/${state.issues[item.id].number}/dependencies/blocked_by`);
    for (const dep of missing) {
      if (!existingDeps.some((entry) => entry.id === state.issues[dep].id)) {
        await writeApi(`${base}/issues/${state.issues[item.id].number}/dependencies/blocked_by`, "POST", { issue_id: state.issues[dep].id });
      }
      state.dependencies.push(`${item.id}<${dep}`);
      checkpoint();
      if (state.dependencies.length % 15 === 0) console.log(`Dependency links ${state.dependencies.length}`);
    }
  }
  writeIndex();
  console.log(JSON.stringify({ ...summary, parents: state.parents.length, dependencies: state.dependencies.length, roadmap: state.issues.ROADMAP.url }));
}

function verify() {
  const remote = list(`${base}/issues?state=all`).filter((issue) => !issue.pull_request);
  const failures = [];
  for (const item of allItems) {
    const issue = remote.find((entry) => entry.number === state.issues[item.id]?.number);
    if (!issue) { failures.push(`${item.id}: missing`); continue; }
    if (!issue.body?.includes(`<!-- backlog-id: ${item.id} -->`)) failures.push(`${item.id}: marker`);
    if (!issue.body?.includes("Acceptance criteria")) failures.push(`${item.id}: acceptance`);
    if (!issue.milestone || issue.milestone.number !== state.milestones[item.stage]) failures.push(`${item.id}: milestone`);
    for (const dep of item.dependencies) if (!issue.body.includes(reference(dep))) failures.push(`${item.id}: dependency ${dep}`);
    for (const label of [`type:${item.kind}`, `priority:${item.priority}`, `area:${item.area}`]) {
      if (!issue.labels.some((entry) => entry.name === label)) failures.push(`${item.id}: label ${label}`);
    }
    const deps = list(`${base}/issues/${issue.number}/dependencies/blocked_by`);
    for (const dep of item.dependencies) if (!deps.some((entry) => entry.id === state.issues[dep].id)) failures.push(`${item.id}: native dependency ${dep}`);
  }
  for (const parent of ["ROADMAP", ...stages.map((stage) => `EPIC-${stage.id}`)]) {
    const actual = list(`${base}/issues/${state.issues[parent].number}/sub_issues`);
    for (const pair of state.parents.filter((entry) => entry.startsWith(`${parent}>`))) {
      const child = pair.split(">")[1];
      if (!actual.some((entry) => entry.id === state.issues[child].id)) failures.push(`Missing native child ${pair}`);
    }
  }
  const expectedCount = summary.total;
  const managed = remote.filter((issue) => /<!-- backlog-id: /.test(issue.body || ""));
  if (managed.length !== expectedCount) failures.push(`Managed count ${managed.length} != ${expectedCount}`);
  if (failures.length) throw new Error(failures.join("\n"));
  state.verified = { issues: expectedCount, parents: state.parents.length, dependencies: state.dependencies.length };
  checkpoint();
  writeIndex();
  console.log(`VERIFIED ${JSON.stringify(state.verified)}`);
}

if (applying) await publish();
else if (verifying) verify();
else {
  writeIndex();
  const preview = ["# Preview publikasi GitHub Issues", roadmapBody(), ...stages.map(epicBody), ...allItems.map(itemBody)].join("\n\n---\n\n");
  fs.writeFileSync(path.join(temporary, "issue-preview.md"), preview);
  console.log(`Local preview only: ${JSON.stringify(summary)}; tmp/github-backlog/issue-preview.md`);
}
