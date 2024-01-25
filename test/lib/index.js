const test = require("ava");

test("index.js exports logger module", (t) => {
	t.fail("test to fail");
	const index = require("../../");
	t.truthy(index, "Module exported");
	t.is(index, require("../../lib/logger"), "Logger module exported");
});
