const test = require("ava");

const logger = require("../../lib/logger");
const Logger = logger._Logger;

test("getLogger", (t) => {
	t.is(typeof logger.getLogger, "function");

	const myLogger = logger.getLogger("my-module");
	t.true(myLogger instanceof Logger, "Returned logger should be Logger instance");
});

test("getGroupLogger", (t) => {
	t.is(typeof logger.getGroupLogger, "function");
});

test("setLevel", (t) => {
	t.is(typeof logger.setLevel, "function");
});

test("isLevelEnabled", (t) => {
	t.is(typeof logger.isLevelEnabled, "function");
});

test("setShowProgress", (t) => {
	t.is(typeof logger.setShowProgress, "function");
});
