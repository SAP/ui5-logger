import test from "ava";
import sinon from "sinon";
import StandardLogger from "../../../lib/loggers/StandardLogger.js";

test.serial.beforeEach((t) => {
	t.context.logHandler = sinon.stub();
	process.on("ui5.log", t.context.logHandler);
});

test.serial.afterEach.always((t) => {
	process.off("ui5.log", t.context.logHandler);
	delete process.env.UI5_LOG_LVL;
	sinon.restore();
});

test.serial("isLevelEnabled", (t) => {
	// On silly all levels should be enabled
	process.env.UI5_LOG_LVL = "silly";
	t.true(StandardLogger.isLevelEnabled("silly"));
	t.true(StandardLogger.isLevelEnabled("verbose"));
	t.true(StandardLogger.isLevelEnabled("perf"));
	t.true(StandardLogger.isLevelEnabled("info"));
	t.true(StandardLogger.isLevelEnabled("warn"));
	t.true(StandardLogger.isLevelEnabled("error"));
	t.true(StandardLogger.isLevelEnabled("silent"));

	// On silent only silent should be enabled
	process.env.UI5_LOG_LVL = "silent";
	t.false(StandardLogger.isLevelEnabled("silly"));
	t.false(StandardLogger.isLevelEnabled("verbose"));
	t.false(StandardLogger.isLevelEnabled("perf"));
	t.false(StandardLogger.isLevelEnabled("info"));
	t.false(StandardLogger.isLevelEnabled("warn"));
	t.false(StandardLogger.isLevelEnabled("error"));
	t.true(StandardLogger.isLevelEnabled("silent"));

	// On info only info,warn,error,silent should be enabled
	process.env.UI5_LOG_LVL = "info";
	t.false(StandardLogger.isLevelEnabled("silly"));
	t.false(StandardLogger.isLevelEnabled("verbose"));
	t.false(StandardLogger.isLevelEnabled("perf"));
	t.true(StandardLogger.isLevelEnabled("info"));
	t.true(StandardLogger.isLevelEnabled("warn"));
	t.true(StandardLogger.isLevelEnabled("error"));
	t.true(StandardLogger.isLevelEnabled("silent"));

	t.throws(() => {
		StandardLogger.isLevelEnabled("all");
	}, {message: `Unknown log level "all"`});

	process.env.UI5_LOG_LVL = "unknown level";
	t.throws(() => {
		StandardLogger.isLevelEnabled("warn");
	}, {message: `UI5 Logger: Environment variable UI5_LOG_LVL is set to an unknown log level "unknown level". ` +
			`Valid levels are silly, verbose, perf, info, warn, error, silent`});
});

test.serial("Setting all log levels", (t) => {
	const levels = ["silly", "verbose", "perf", "info", "warn", "error", "silent"];

	for (const level of levels) {
		process.env.UI5_LOG_LVL = level;
		t.true(StandardLogger.isLevelEnabled(level), `Set level ${level} should be enabled`);
	}
});

test.serial("Logger: Log messages", (t) => {
	const {logHandler} = t.context;
	const myLogger = new StandardLogger("my:module:name");

	["silly", "verbose", "perf", "info", "warn", "error"].forEach((level) => {
		myLogger[level]("Message 1");
		t.is(logHandler.callCount, 1, "Emitted and captured one log event");
		t.deepEqual(logHandler.getCall(0).args[0], {
			level,
			message: "Message 1",
			moduleName: "my:module:name",
		}, "Emitted correct log event");
		logHandler.reset();
	});
});
