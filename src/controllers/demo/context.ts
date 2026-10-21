// TODO: Move production authorization to verified server sessions when external services are connected.
import type { DemoState, DemoUser, MentoringRequest, Team } from "@/models/demo/types";

/** Return the active fictional account or reject an unauthenticated command. */
export function requireActor(state: DemoState): DemoUser {
  const actor = state.users.find(function matchingAccount(user) { return user.id === state.userId; });
  if (!actor) throw new Error("Masuk ke akun demo terlebih dahulu.");
  return actor;
}

/** Resolve the actor's active team without exposing unrelated private team content. */
export function actorTeam(state: DemoState, actor = requireActor(state)): Team | undefined {
  return state.teams.find(function membership(team) { return team.memberIds.includes(actor.id); });
}

/** Enforce leader-only operations for a specific existing team. */
export function requireLeader(state: DemoState, teamId: string): Team {
  const actor = requireActor(state);
  const team = state.teams.find(function matchingTeam(value) { return value.id === teamId; });
  if (!team || team.leaderId !== actor.id) throw new Error("Tindakan ini hanya dapat dilakukan ketua tim.");
  return team;
}

/** Enforce the administrator role for operational commands. */
export function requireAdmin(state: DemoState) {
  const actor = requireActor(state);
  if (actor.role !== "admin") throw new Error("Tindakan ini hanya tersedia untuk administrator.");
  return actor;
}

/** Create a collision-resistant identifier for a new example entity. */
export function newId(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }

/** Validate a user-entered label without silently truncating persisted data. */
export function requiredText(value: string, label: string, maximum = 500) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error(`${label} wajib diisi.`);
  if (cleaned.length > maximum) throw new Error(`${label} maksimal ${maximum} karakter.`);
  return cleaned;
}

/** Accept only HTTP(S) destinations and reject embedded credentials or executable schemes. */
export function safeUrl(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("Masukkan URL lengkap yang valid."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error("Gunakan link HTTP/HTTPS tanpa kredensial.");
  return url.toString();
}

/** Record a command actor and its explanation in the example audit history. */
export function audit(state: DemoState, action: string, target: string, note = "") {
  state.audit.unshift({ id: newId("audit"), actorId: requireActor(state).id, action, target, note, at: new Date().toISOString() });
}

/** Deliver an in-app example notification to a known local account. */
export function notify(state: DemoState, userId: string, title: string, href: string) {
  state.notifications.unshift({ id: newId("notice"), userId, title, href, read: false, at: new Date().toISOString() });
}

/** Append an immutable history entry to the request being changed. */
export function requestEvent(state: DemoState, request: MentoringRequest, label: string, note: string) {
  request.events.push({ id: newId("event"), actorId: requireActor(state).id, label, note, at: new Date().toISOString() });
}
