import test from "ava";
import logger from "../../lib/index.js";
import StandardLogger from "../../lib/loggers/StandardLogger.js";

test.serial.afterEach.always((t) => {
	delete process.env.UI5_LOG_LVL;
});

test.serial("getLogger", (t) => {
	const myLogger = logger.getLogger("my-module");
	t.true(myLogger instanceof StandardLogger, "Returned logger should be StandardLogger instance");
});

test.serial("isLevelEnabled", (t) => {
	// On info only info,warn,error,silent should be enabled
	process.env.UI5_LOG_LVL = "info";
	t.false(logger.isLevelEnabled("silly"));
	t.false(logger.isLevelEnabled("verbose"));
	t.false(logger.isLevelEnabled("perf"));
	t.true(logger.isLevelEnabled("info"));
	t.true(logger.isLevelEnabled("warn"));
	t.true(logger.isLevelEnabled("error"));
	t.true(logger.isLevelEnabled("silent"));
});
