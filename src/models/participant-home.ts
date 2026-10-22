// TODO: Pertahankan kontrak presentasi Home V2 bebas dari repository demo maupun Supabase.
import type { OperationalStatus } from "./connected/operations";
export interface HomeMentorPreview {
	id: string;
	name: string;
	photo?: string;
	title: string;
	expertise: string;
	dates: string[];
}
export interface ParticipantHomeViewModel {
	actor: { id: string; name: string };
	settings: {
		dates: string[];
		start: string;
		end: string;
		sessionMinutes: number;
		bufferMinutes: number;
		discord: string;
	};
	users: { id: string; name: string }[];
	resources: { id: string; title: string; url: string; active: boolean }[];
	preview: HomeMentorPreview[];
	team: {
		id: string;
		name: string;
		memberIds: string[];
		leaderId: string;
	} | null;
	work: { title: string; description: string } | null;
	request: {
		id: string;
		code?: string;
		title: string;
		status: OperationalStatus;
		note: string;
		meetingUrl: string;
	} | null;
	slot: { date: string; start: string; end: string } | null;
	mentor: { name: string; expertise: string; photo?: string } | null;
	ready: boolean;
	files: number;
	links: number;
	joins: number;
	leader: boolean;
	greeting: string;
}
