// TODO: Replace this demo-only repository with an authenticated persistence adapter before production.
import { createDemoSeed } from "./seed";
import type { DemoState } from "./types";

const STORAGE_KEY = "adikara-demo-mvc-v1";
let snapshot: DemoState | null = null;
const listeners = new Set<() => void>();

/** Notify subscribed controllers after a durable local state change. */
function notifyListeners() { for (const listener of listeners) listener(); }

/** Return the stable client snapshot required by useSyncExternalStore. */
export function getDemoSnapshot() { return snapshot; }

/** Return an empty snapshot during server rendering to avoid leaking browser state. */
export function getServerDemoSnapshot() { return null; }

/** Subscribe a view/controller to model changes and return its cleanup callback. */
export function subscribeDemo(listener: () => void) {
  listeners.add(listener);
  /** Release this controller subscription when the component unmounts. */
  return function unsubscribeDemo() { listeners.delete(listener); };
}

/** Validate the persisted demo envelope before accepting browser data. */
function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<DemoState>;
  return data.version === 1 && typeof data.revision === "number" && Array.isArray(data.users) && Array.isArray(data.teams) && Array.isArray(data.mentors) && Array.isArray(data.requests) && Array.isArray(data.slots) && Array.isArray(data.works) && Array.isArray(data.documents) && Array.isArray(data.joins) && Array.isArray(data.notifications) && Array.isArray(data.audit) && Array.isArray(data.resources) && Array.isArray(data.feedback) && !!data.settings;
}

/** Hydrate the repository once and show a recovery notice if saved demo data is invalid. */
export function initializeDemo() {
  if (snapshot || typeof window === "undefined") return;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : createDemoSeed();
    if (!isDemoState(parsed)) throw new Error("Format data demo berubah.");
    snapshot = parsed;
  } catch {
    snapshot = createDemoSeed();
    snapshot.recovery = "Data demo sebelumnya tidak dapat dibaca. Contoh awal dipulihkan; tidak ada data server yang diubah.";
  }
  notifyListeners();
}

/** Persist a successful command before publishing it so failed saves do not appear successful. */
export function saveDemo(next: DemoState) {
  const updated = { ...next, revision: next.revision + 1 };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); }
  catch { throw new Error("Penyimpanan browser penuh atau tidak tersedia. Perubahan belum disimpan."); }
  snapshot = updated;
  notifyListeners();
}

/** Reset only this application's fictional workspace and leave unrelated browser data intact. */
export function resetDemo() { saveDemo(createDemoSeed()); }

/** Apply changes from another browser tab to the same local demo workspace. */
export function synchronizeDemo(event: StorageEvent) {
  if (event.key !== STORAGE_KEY) return;
  snapshot = null;
  initializeDemo();
}
