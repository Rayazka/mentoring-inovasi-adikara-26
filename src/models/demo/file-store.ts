// TODO: Ganti penyimpanan perangkat ini dengan bucket privat dan URL unduhan berumur pendek pada produksi.
const DATABASE = "adikara-demo-files-v1";

/** Membuka penyimpanan berkas lokal yang tidak dikirim ke server. */
function openDatabase(): Promise<IDBDatabase> {
	return new Promise(
		/** Menangani pembukaan dan pembuatan object store pada perangkat pengguna. */
		function openStore(resolve, reject) {
			const request = indexedDB.open(DATABASE, 1);
			/** Membuat object store pada kunjungan pertama. */
			request.onupgradeneeded = function createStore() {
				request.result.createObjectStore("files");
			};
			/** Mengembalikan koneksi database yang sudah tersedia. */
			request.onsuccess = function databaseOpened() {
				resolve(request.result);
			};
			/** Melaporkan kegagalan penyimpanan tanpa menyatakan upload berhasil. */
			request.onerror = function databaseFailed() {
				reject(new Error("Penyimpanan file browser tidak tersedia."));
			};
		},
	);
}

/** Membaca, menyimpan atau menghapus satu objek melalui transaksi IndexedDB yang ditunggu sampai selesai. */
export async function fileStore(
	action: "read" | "write" | "delete",
	key: string,
	file?: Blob,
): Promise<Blob | undefined> {
	const database = await openDatabase();
	try {
		return await new Promise(
			/** Menunggu penyelesaian transaksi agar kegagalan kuota tidak tertutup. */
			function transact(resolve, reject) {
				const transaction = database.transaction(
					"files",
					action === "read" ? "readonly" : "readwrite",
				);
				const store = transaction.objectStore("files");
				const request =
					action === "read"
						? store.get(key)
						: action === "write"
							? store.put(file, key)
							: store.delete(key);
				/** Mengembalikan objek hanya setelah transaksi selesai. */
				transaction.oncomplete = function complete() {
					resolve(action === "read" ? request.result : undefined);
				};
				/** Meneruskan kegagalan transaksi kepada controller. */
				transaction.onerror = function fail() {
					reject(
						new Error(
							"File gagal diproses. Periksa ruang penyimpanan browser.",
						),
					);
				};
				/** Memastikan transaksi yang dibatalkan tidak meninggalkan UI dalam status menunggu. */
				transaction.onabort = function abort() {
					reject(new Error("Penyimpanan file dibatalkan."));
				};
			},
		);
	} finally {
		database.close();
	}
}
