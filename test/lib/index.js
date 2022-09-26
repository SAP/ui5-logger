import test from "ava";

test("index.js exports logger module", async (t) => {
	const {default: index} = await import("../../index.js");
	t.truthy(index, "Module exported");

	const {default: logger} = await import("../../lib/logger.js");
	t.is(index, logger, "Logger module exported");
});
