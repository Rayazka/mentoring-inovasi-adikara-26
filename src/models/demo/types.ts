// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
export type Role = "participant" | "mentor" | "admin";
export type RequestStatus =
	| "pending"
	| "revision_requested"
	| "approved"
	| "rejected"
	| "cancelled"
	| "completed";
export interface DemoUser {
	id: string;
	name: string;
	role: Role;
	mentorId?: string;
}
export interface Team {
	id: string;
	name: string;
	category: string;
	description: string;
	leaderId: string;
	memberIds: string[];
}
export interface Work {
	teamId: string;
	title: string;
	description: string;
	updatedAt: string;
}
export interface Mentor {
	id: string;
	name: string;
	title: string;
	expertise: string;
	bio: string;
	achievements: string[];
	active: boolean;
	archived: boolean;
	userId?: string;
	dates: string[];
}
export interface Slot {
	id: string;
	mentorId: string;
	date: string;
	start: string;
	end: string;
	bufferEnd: string;
	enabled: boolean;
}
export interface TeamDocument {
	id: string;
	teamId: string;
	title: string;
	kind: "file" | "drive";
	url?: string;
	filename?: string;
	bytes?: number;
	uploaderId: string;
	updatedAt: string;
	inaccessible: boolean;
}
export interface JoinRequest {
	id: string;
	teamId: string;
	userId: string;
	note: string;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
}
export interface RequestEvent {
	id: string;
	actorId: string;
	label: string;
	note: string;
	at: string;
}
export interface ChangeProposal {
	slotId: string;
	note: string;
	accepted: boolean;
	authorId: string;
}
export interface MentoringRequest {
	id: string;
	teamId: string;
	mentorId: string;
	slotId: string;
	status: RequestStatus;
	title: string;
	description: string;
	documentIds: string[];
	meetingUrl: string;
	note: string;
	revisionKind?: "work" | "schedule" | "both";
	proposedSlotId?: string;
	change?: ChangeProposal;
	events: RequestEvent[];
	createdAt: string;
	submittedBy: string;
}
export interface Notification {
	id: string;
	userId: string;
	title: string;
	href: string;
	read: boolean;
	at: string;
}
export interface AuditEvent {
	id: string;
	actorId: string;
	action: string;
	target: string;
	note: string;
	at: string;
}
export interface ResourceLink {
	id: string;
	title: string;
	url: string;
	active: boolean;
}
export interface Feedback {
	id: string;
	requestId: string;
	userId: string;
	rating: number;
	note: string;
}
export interface DemoSettings {
	start: string;
	end: string;
	sessionMinutes: number;
	bufferMinutes: number;
	discord: string;
	dates: string[];
	expireHours: number;
}
export interface DemoState {
	version: 1;
	revision: number;
	userId: string | null;
	users: DemoUser[];
	teams: Team[];
	works: Work[];
	mentors: Mentor[];
	slots: Slot[];
	documents: TeamDocument[];
	joins: JoinRequest[];
	requests: MentoringRequest[];
	notifications: Notification[];
	audit: AuditEvent[];
	resources: ResourceLink[];
	feedback: Feedback[];
	settings: DemoSettings;
	recovery: string;
}
