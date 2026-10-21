// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import { generateSlots } from "@/lib/mentoring/schedule";
import type { DemoState, Mentor, Slot } from "./types";

/** Membuat profil mentor fiktif tanpa membaca CSV atau foto privat. */
function createMentors(): Mentor[] {
	const names = [
		"Nara Putra",
		"Intan Prameswari",
		"Dimas Pradana",
		"Kirana Sari",
		"Raka Mahendra",
		"Tania Kusuma",
		"Aditya Pratama",
		"Maya Safitri",
		"Banyu Wicaksono",
	];
	const fields = [
		"UI/UX",
		"UI/UX",
		"Softdev",
		"IoT",
		"Softdev",
		"UI/UX",
		"Gamedev",
		"Softdev",
		"Softdev",
	];
	return names.map(
		/** Menjalankan langkah mentorFixture sesuai tanggung jawab modul ini. */
		function mentorFixture(name, index) {
			return {
				id: `mentor-${index + 1}`,
				name,
				expertise: fields[index],
				title: `Mentor ${fields[index]} · Data contoh`,
				bio: "Profil fiktif untuk mencoba alur mentoring. Bantu tim memperjelas arah karya dan menyiapkan langkah pengembangan berikutnya.",
				achievements: [
					"Portofolio dan pengalaman pada mode demo merupakan data fiktif.",
				],
				active: true,
				archived: false,
				userId: `user-mentor-${index + 1}`,
				dates: index === 2 ? ["2026-10-24"] : ["2026-10-24", "2026-10-25"],
			};
		},
	);
}

/** Membuat blok sesi dan jeda lengkap untuk setiap mentor fiktif. */
export function createSeedSlots(
	mentors: Mentor[],
	start = "18:30",
	end = "22:00",
): Slot[] {
	return mentors.flatMap(
		/** Menjalankan langkah mentorSlots sesuai tanggung jawab modul ini. */
		function mentorSlots(mentor) {
			return mentor.dates.flatMap(
				/** Menjalankan langkah daySlots sesuai tanggung jawab modul ini. */
				function daySlots(date) {
					return generateSlots({
						start,
						end,
						sessionMinutes: 15,
						bufferMinutes: 5,
					}).map(
						/** Menjalankan langkah slotFixture sesuai tanggung jawab modul ini. */
						function slotFixture(slot) {
							return {
								id: `${mentor.id}-${date}-${slot.start}`,
								mentorId: mentor.id,
								date,
								start: slot.start,
								end: slot.sessionEnd,
								bufferEnd: slot.bufferEnd,
								enabled: true,
							};
						},
					);
				},
			);
		},
	);
}

/** Membuat workspace contoh yang dapat diulang dengan dua tim dan akun terpisah. */
export function createDemoSeed(): DemoState {
	const mentors = createMentors();
	const at = "2026-10-21T10:00:00.000Z";
	return {
		version: 1,
		revision: 0,
		userId: null,
		recovery: "",
		mentors,
		slots: createSeedSlots(mentors),
		users: [
			{ id: "alya", name: "Alya Putri", role: "participant" },
			{ id: "rafi", name: "Rafi Pratama", role: "participant" },
			{ id: "sinta", name: "Sinta Maharani", role: "participant" },
			{ id: "bima", name: "Bima Aditya", role: "participant" },
			{ id: "admin", name: "Panitia ADIKARA", role: "admin" },
			...mentors.map(
				/** Menjalankan langkah mentorAccount sesuai tanggung jawab modul ini. */
				function mentorAccount(mentor) {
					return {
						id: `user-${mentor.id}`,
						name: mentor.name,
						role: "mentor" as const,
						mentorId: mentor.id,
					};
				},
			),
		],
		teams: [
			{
				id: "team-1",
				name: "Nusa Aksi",
				category: "Innovation",
				description:
					"Platform untuk mempertemukan relawan dan kegiatan sosial lokal.",
				leaderId: "alya",
				memberIds: ["alya", "rafi"],
			},
			{
				id: "team-2",
				name: "Akar Cerdas",
				category: "Innovation",
				description: "Pemantauan tanaman yang mudah diakses masyarakat.",
				leaderId: "bima",
				memberIds: ["bima"],
			},
		],
		works: [
			{
				teamId: "team-1",
				title: "Nusa Aksi — platform relawan",
				description:
					"Kami membantu relawan menemukan kegiatan sosial yang sesuai. Tim ingin menguji kejelasan alur pendaftaran dan menyederhanakan informasi sebelum membangun prototipe.",
				updatedAt: at,
			},
			{
				teamId: "team-2",
				title: "Akar Cerdas — kebun terhubung",
				description:
					"Pemantauan kondisi tanaman menggunakan sensor dan ringkasan informasi yang mudah dibaca.",
				updatedAt: at,
			},
		],
		documents: [],
		joins: [
			{
				id: "join-1",
				teamId: "team-1",
				userId: "sinta",
				note: "Saya ingin membantu riset pengguna dan pengujian prototipe.",
				status: "pending",
				createdAt: at,
			},
		],
		requests: [
			{
				id: "MT-026",
				teamId: "team-1",
				mentorId: "mentor-1",
				slotId: "mentor-1-2026-10-24-18:50",
				status: "pending",
				title: "Nusa Aksi — platform relawan",
				description:
					"Mohon masukan untuk alur pendaftaran relawan dan prioritas pengujian prototipe.",
				documentIds: [],
				meetingUrl: "",
				note: "",
				createdAt: at,
				submittedBy: "alya",
				events: [
					{
						id: "event-seed",
						actorId: "alya",
						label: "Pengajuan dikirim",
						note: "Menunggu respons mentor. Waktu belum terkonfirmasi.",
						at,
					},
				],
			},
		],
		notifications: [
			{
				id: "notice-seed",
				userId: "alya",
				title: "Sinta ingin bergabung dengan Nusa Aksi",
				href: "/peserta/tim?tab=permintaan",
				read: false,
				at,
			},
		],
		audit: [],
		feedback: [],
		settings: {
			start: "18:30",
			end: "22:00",
			sessionMinutes: 15,
			bufferMinutes: 5,
			discord: "https://discord.gg/YR2W6vBzt",
			dates: ["2026-10-24", "2026-10-25"],
			expireHours: 48,
		},
		resources: [
			{
				id: "guide",
				title: "Guidebook ADIKARA 2026",
				url: "https://helloprodigi.pro/GuidebookADIKARA2026",
				active: true,
			},
			{
				id: "proposal",
				title: "Template Proposal",
				url: "https://helloprodigi.pro/TemplateProposalADIKARA2026",
				active: true,
			},
			{
				id: "twibbon",
				title: "Twibbon & Caption",
				url: "https://helloprodigi.pro/TwibbonADIKARA2026",
				active: true,
			},
			{
				id: "register",
				title: "Pendaftaran",
				url: "https://helloprodigi.pro/PendaftaranAdikara2026",
				active: true,
			},
		],
	};
}
