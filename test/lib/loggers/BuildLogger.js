import test from "ava";
import sinon from "sinon";
import BuildLogger from "../../../lib/loggers/BuildLogger.js";

test.serial.beforeEach((t) => {
	t.context.logHandler = sinon.stub();
	process.on("ui5.log", t.context.logHandler);
});

test.serial.afterEach.always((t) => {
	process.off("ui5.log", t.context.logHandler);
	delete process.env.UI5_LOG_LVL;
	sinon.restore();
});

test.serial("Logger: Log messages", (t) => {
	const {logHandler} = t.context;
	const myLogger = new BuildLogger("my:module:name");

	BuildLogger.LOG_LEVELS.forEach((level) => {
		if (level === "silent") {
			// Can't log silent messages
			return;
		}
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
