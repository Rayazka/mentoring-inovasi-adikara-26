import { describe, expect, it } from "vitest";
import { defaultSchedule, generateSlots } from "../src/lib/mentoring/schedule";

describe("mentoring slot generation", () => {
  it("fits ten sessions with their full buffers inside the default operating window", () => {
    const slots = generateSlots();
    expect(slots).toHaveLength(10);
    expect(slots[0]).toEqual({ start: "18:30", sessionEnd: "18:45", bufferEnd: "18:50" });
    expect(slots.at(-1)).toEqual({ start: "21:30", sessionEnd: "21:45", bufferEnd: "21:50" });
  });

  it("honors an admin-defined window and includes a block ending exactly at closing", () => {
    expect(generateSlots({ ...defaultSchedule, start: "19:00", end: "19:40" }))
      .toEqual([
        { start: "19:00", sessionEnd: "19:15", bufferEnd: "19:20" },
        { start: "19:20", sessionEnd: "19:35", bufferEnd: "19:40" },
      ]);
  });

  it("does not squeeze in a session when its buffer cannot fit", () => {
    expect(generateSlots({ ...defaultSchedule, start: "21:40", end: "21:59" })).toEqual([]);
  });

  it.each([
    { start: "22:00", end: "18:30" },
    { start: "18:30", end: "18:30" },
    { start: "25:00", end: "26:00" },
    { sessionMinutes: 0 },
    { bufferMinutes: -1 },
  ])("rejects invalid configuration %j", (override) => {
    expect(() => generateSlots({ ...defaultSchedule, ...override })).toThrow();
  });
});
