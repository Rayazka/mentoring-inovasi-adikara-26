// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import { createDemoSeed } from "./seed";
import type { DemoState } from "./types";

const STORAGE_KEY = "adikara-demo-mvc-v1";
let snapshot: DemoState | null = null;
const listeners = new Set<() => void>();

/** Memberi tahu controller setelah perubahan lokal berhasil disimpan. */
function notifyListeners() {
	for (const listener of listeners) listener();
}

/** Mengambil snapshot browser yang stabil untuk langganan perubahan React. */
export function getDemoSnapshot() {
	return snapshot;
}

/** Mengembalikan snapshot kosong saat render server agar data browser tidak tercampur. */
export function getServerDemoSnapshot() {
	return null;
}

/** Mendaftarkan pemantauan perubahan model dan menyediakan fungsi pembersihannya. */
export function subscribeDemo(listener: () => void) {
	listeners.add(listener);
	/** Melepas langganan controller ketika komponen tidak lagi digunakan. */
	/** Melepas callback controller ketika langganannya dihentikan. */
	function unsubscribeDemo() {
		listeners.delete(listener);
	}
	return unsubscribeDemo;
}

/** Memeriksa struktur data demo sebelum menerima isi penyimpanan browser. */
function isDemoState(value: unknown): value is DemoState {
	if (!value || typeof value !== "object") return false;
	const data = value as Partial<DemoState>;
	return (
		data.version === 1 &&
		typeof data.revision === "number" &&
		Array.isArray(data.users) &&
		Array.isArray(data.teams) &&
		Array.isArray(data.mentors) &&
		Array.isArray(data.requests) &&
		Array.isArray(data.slots) &&
		Array.isArray(data.works) &&
		Array.isArray(data.documents) &&
		Array.isArray(data.joins) &&
		Array.isArray(data.notifications) &&
		Array.isArray(data.audit) &&
		Array.isArray(data.resources) &&
		Array.isArray(data.feedback) &&
		!!data.settings
	);
}

/** Memuat repository sekali dan menampilkan pemberitahuan jika data demo harus dipulihkan. */
export function initializeDemo() {
	if (snapshot || typeof window === "undefined") return;
	try {
		const saved = localStorage.getItem(STORAGE_KEY);
		const parsed: unknown = saved ? JSON.parse(saved) : createDemoSeed();
		if (!isDemoState(parsed)) throw new Error("Format data demo berubah.");
		snapshot = parsed;
	} catch {
		snapshot = createDemoSeed();
		snapshot.recovery =
			"Data demo sebelumnya tidak dapat dibaca. Contoh awal dipulihkan; tidak ada data server yang diubah.";
	}
	notifyListeners();
}

/** Menyimpan perubahan sebelum memperbarui tampilan agar kegagalan simpan tidak terlihat berhasil. */
export function saveDemo(next: DemoState) {
	const updated = { ...next, revision: next.revision + 1 };
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
	} catch {
		throw new Error(
			"Penyimpanan browser penuh atau tidak tersedia. Perubahan belum disimpan.",
		);
	}
	snapshot = updated;
	notifyListeners();
}

/** Mengembalikan data contoh aplikasi tanpa menghapus data browser lain. */
export function resetDemo() {
	saveDemo(createDemoSeed());
}

/** Menyelaraskan perubahan workspace demo dari tab browser lain. */
export function synchronizeDemo(event: StorageEvent) {
	if (event.key !== STORAGE_KEY) return;
	snapshot = null;
	initializeDemo();
}
