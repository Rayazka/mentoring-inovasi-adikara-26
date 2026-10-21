// TODO: Pelihara dokumentasi dan pengujian saat modul ini berubah.
import { z } from "zod";

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const scheduleSchema = z
	.object({
		start: time,
		end: time,
		sessionMinutes: z.number().int().positive(),
		bufferMinutes: z.number().int().nonnegative(),
	})
	.refine(
		/** Memproses elemen atau peristiwa lokal untuk operasi yang sedang dijalankan. */
		(value) => toMinutes(value.end) > toMinutes(value.start),
		{
			message: "Jam berakhir harus setelah jam mulai pada hari yang sama.",
		},
	);

export type ScheduleSettings = z.infer<typeof scheduleSchema>;
export const defaultSchedule: ScheduleSettings = {
	start: "18:30",
	end: "22:00",
	sessionMinutes: 15,
	bufferMinutes: 5,
};

/** Mengubah jam dan menit menjadi jumlah menit sejak tengah malam. */
function toMinutes(value: string) {
	const [hours, minutes] = value.split(":").map(Number);
	return hours * 60 + minutes;
}

/** Mengubah jumlah menit menjadi teks jam yang konsisten. */
function clock(minutes: number) {
	return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Membentuk slot jam lokal Asia/Jakarta dengan jeda penuh pada tanggal yang sama. */
export function generateSlots(settings: ScheduleSettings = defaultSchedule) {
	const validated = scheduleSchema.parse(settings);
	const step = validated.sessionMinutes + validated.bufferMinutes;
	const slots: { start: string; sessionEnd: string; bufferEnd: string }[] = [];
	for (
		let start = toMinutes(validated.start);
		start + step <= toMinutes(validated.end);
		start += step
	) {
		slots.push({
			start: clock(start),
			sessionEnd: clock(start + validated.sessionMinutes),
			bufferEnd: clock(start + step),
		});
	}
	return slots;
}
