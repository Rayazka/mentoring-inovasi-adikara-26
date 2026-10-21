// TODO: Add Google session integration tests after production authentication is enabled.
import { describe, expect, it } from "vitest";
import { createDemoSeed } from "../src/models/demo/seed";
import { sessionCommand } from "../src/controllers/demo/session-controller";

/** Verify the local-only login flow never fabricates unknown or archived accounts. */
describe("demo sessions", function sessionSuite() {
	/** Exercise a valid login and subsequent logout on fictional data. */
	it("logs in and out without an external provider", function localLogin() {
		const state = createDemoSeed();
		sessionCommand(state, "session.login", { userId: "alya" });
		expect(state.userId).toBe("alya");
		sessionCommand(state, "session.logout", {});
		expect(state.userId).toBeNull();
	});
	/** Ensure disabled mentor identities do not regain access through the login selector. */
	it("rejects a disabled mentor", function disabledMentor() {
		const state = createDemoSeed();
		state.mentors[0].active = false;
		/** Assert that the disabled identity cannot sign in. */
		expect(function deniedLogin() {
			sessionCommand(state, "session.login", { userId: "user-mentor-1" });
		}).toThrow();
	});
});
