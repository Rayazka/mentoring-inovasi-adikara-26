// TODO: Jalankan hanya pada database lokal sekali pakai yang namanya berakhiran _test.
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";

const database = process.env.ADIKARA_TEST_DATABASE;
if (!database?.endsWith("_test") || process.env.ADIKARA_SQL_TEST !== "1")
	throw new Error(
		"Gunakan ADIKARA_SQL_TEST=1 dan database lokal berakhiran _test.",
	);
const psql =
	process.env.ADIKARA_PSQL ?? "C:/Program Files/PostgreSQL/18/bin/psql.exe";
const actors = {
	admin: randomUUID(),
	a: randomUUID(),
	b: randomUUID(),
	c: randomUUID(),
	d: randomUUID(),
	e: randomUUID(),
};

/** Menjalankan satu koneksi psql ke server uji loopback tanpa memakai kredensial produksi. */
function sql(command) {
	return new Promise(
		/** Mengumpulkan hasil dan kegagalan proses pengujian SQL. */
		function runQuery(resolve, reject) {
			const child = spawn(
				psql,
				[
					"-XAtq",
					"-h",
					"127.0.0.1",
					"-p",
					"55439",
					"-U",
					"postgres",
					"-d",
					database,
					"-v",
					"ON_ERROR_STOP=1",
					"-c",
					command,
				],
				{ windowsHide: true },
			);
			let output = "",
				error = "";
			/** Mengumpulkan keluaran query untuk pemeriksaan hasil. */
			function onOutput(data) {
				output += data.toString();
			}
			/** Mengumpulkan pesan kegagalan tanpa mencetak informasi koneksi rahasia. */
			function onError(data) {
				error += data.toString();
			}
			/** Menyelesaikan proses hanya jika psql benar-benar berhasil. */
			function onClose(code) {
				if (code === 0) resolve(output.trim());
				else reject(new Error(error));
			}
			child.stdout.on("data", onOutput);
			child.stderr.on("data", onError);
			child.on("error", reject);
			child.on("close", onClose);
		},
	);
}
/** Menjalankan RPC sebagai identitas sintetis dan peran authenticated yang tetap terkena RLS. */
function asActor(actor, command) {
	return sql(
		`set role authenticated; set request.jwt.claim.sub='${actor}'; ${command}`,
	);
}
/** Mengambil satu UUID hasil RPC dari keluaran psql. */
function uuid(output) {
	const value = output.split(/\r?\n/).find(
		/** Memilih UUID hasil tanpa bergantung pada keluaran status SQL. */
		function uuidLine(line) {
			return /^[a-f0-9-]{36}$/.test(line);
		},
	);
	assert.ok(value, output);
	return value;
}

const inserts = Object.entries(actors)
	.map(
		/** Menyiapkan akun pengujian unik agar tidak memakai data peserta nyata. */
		function actorRow([name, id]) {
			return `('${id}','${name}-${id}@example.invalid','{}')`;
		},
	)
	.join(",");
await sql(
	`insert into auth.users(id,email,raw_user_meta_data) values ${inserts}; update public.profiles set role='admin' where id='${actors.admin}';`,
);
const teamA = uuid(
	await asActor(
		actors.a,
		`select public.create_team('Race A ${actors.a}','UI/UX','Uji transaksi');`,
	),
);
const teamB = uuid(
	await asActor(
		actors.b,
		`select public.create_team('Race B ${actors.b}','UI/UX','Uji transaksi');`,
	),
);
await asActor(
	actors.admin,
	`select public.admin_add_member('${teamA}','${actors.c}');`,
);
const joinD = uuid(
	await asActor(
		actors.d,
		`select public.request_team_join('${teamA}','D ingin bergabung');`,
	),
);
const joinE = uuid(
	await asActor(
		actors.e,
		`select public.request_team_join('${teamA}','E ingin bergabung');`,
	),
);
const joinResults = await Promise.allSettled([
	asActor(
		actors.a,
		`begin;select public.review_team_join('${joinD}',true);select pg_sleep(0.4);commit;`,
	),
	asActor(
		actors.a,
		`begin;select public.review_team_join('${joinE}',true);select pg_sleep(0.4);commit;`,
	),
]);
assert.equal(
	joinResults.filter(
		/** Menghitung transaksi yang berhasil mendapatkan kursi terakhir. */
		function succeeded(result) {
			return result.status === "fulfilled";
		},
	).length,
	1,
);
for (const result of joinResults)
	if (result.status === "rejected")
		assert.match(result.reason.message, /Tim penuh/);
assert.equal(
	await sql(
		`select count(*) from public.team_members where team_id='${teamA}'`,
	),
	"3",
);

const mentor = uuid(
	await asActor(
		actors.admin,
		`insert into public.mentors(name,expertise) values('Race Mentor ${actors.admin}','UI/UX') returning id;`,
	),
);
await asActor(
	actors.admin,
	`select public.generate_mentor_slots('${mentor}','2026-10-24');`,
);
const slot = uuid(
	await sql(
		`select id from public.mentor_slots where mentor_id='${mentor}' order by starts_at limit 1;`,
	),
);
await asActor(
	actors.a,
	`select public.save_work('${teamA}','Karya A','Deskripsi karya A',false);`,
);
await asActor(
	actors.b,
	`select public.save_work('${teamB}','Karya B','Deskripsi karya B',false);`,
);
const requestA = uuid(
	await asActor(
		actors.a,
		`select public.submit_request('${teamA}','${slot}','${randomUUID()}','{}');`,
	),
);
const requestB = uuid(
	await asActor(
		actors.b,
		`select public.submit_request('${teamB}','${slot}','${randomUUID()}','{}');`,
	),
);
const bookingResults = await Promise.allSettled([
	asActor(
		actors.admin,
		`begin;select public.review_request('${requestA}','approved','','https://meet.example.invalid/a');select pg_sleep(0.4);commit;`,
	),
	asActor(
		actors.admin,
		`begin;select public.review_request('${requestB}','approved','','https://meet.example.invalid/b');select pg_sleep(0.4);commit;`,
	),
]);
assert.equal(
	bookingResults.filter(
		/** Menghitung approval yang benar-benar berhasil melakukan booking. */
		function approved(result) {
			return result.status === "fulfilled";
		},
	).length,
	1,
);
for (const result of bookingResults)
	if (result.status === "rejected")
		assert.match(result.reason.message, /terbooking/);
assert.equal(
	await sql(
		`select count(*) from public.bookings where mentor_id='${mentor}' and active`,
	),
	"1",
);
assert.equal(
	await sql(
		`select count(*) from public.mentoring_requests where id in ('${requestA}','${requestB}') and status='pending'`,
	),
	"1",
);
process.stdout.write(
	"Dua race test lulus: satu kursi terakhir dan satu booking untuk dua approval bersamaan.\n",
);
