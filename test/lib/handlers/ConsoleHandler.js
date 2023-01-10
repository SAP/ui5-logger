import test from "ava";
import sinon from "sinon";
import stripAnsi from "strip-ansi";
import ConsoleHandler from "../../../lib/handlers/ConsoleHandler.js";
import StandardLogger from "../../../lib/loggers/StandardLogger.js";
import BuildLogger from "../../../lib/loggers/BuildLogger.js";
import ProjectBuildLogger from "../../../lib/loggers/ProjectBuildLogger.js";
import TaskLogger from "../../../lib/loggers/TaskLogger.js";

test.serial.beforeEach((t) => {
	t.context.consoleHandler = new ConsoleHandler();
	t.context.stderrWriteSpy = sinon.spy(process.stderr, "write");
	process.env.UI5_LOG_LVL = "silly";
});

test.serial.afterEach.always((t) => {
	t.context.consoleHandler.disable();
	sinon.restore();
	delete process.env.UI5_LOG_LVL;
});

test.serial("Log standard messages", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new StandardLogger("my-module");

	StandardLogger.LOG_LEVELS.forEach((level) => {
		myLogger[level]("Message 1");
		if (level === "verbose") {
			// "verbose" is abbreviated
			level = "verb";
		}
		t.is(stderrWriteSpy.callCount, 1, "Logged one message");
		t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]), `${level} my-module: Message 1\n`,
			"Logged expected message");
		stderrWriteSpy.resetHistory();
	});
});

test.serial("Log ProjectBuild messages", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new ProjectBuildLogger({
		projectName: "project.name",
		projectType: "project-type"
	});

	ProjectBuildLogger.LOG_LEVELS.forEach((level) => {
		myLogger[level]("Message 1");
		if (level === "verbose") {
			// "verbose" is abbreviated
			level = "verb";
		}
		t.is(stderrWriteSpy.callCount, 1, "Logged one message");
		t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]), `${level} project-type project.name: Message 1\n`,
			"Logged expected message");
		stderrWriteSpy.resetHistory();
	});
});

test.serial("Log Task messages", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new TaskLogger({
		projectName: "project.name",
		projectType: "project-type",
		taskName: "taskName"
	});

	TaskLogger.LOG_LEVELS.forEach((level) => {
		myLogger[level]("Message 1");
		if (level === "verbose") {
			// "verbose" is abbreviated
			level = "verb";
		}
		t.is(stderrWriteSpy.callCount, 1, "Logged one message");
		t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]), `${level} project-type project.name taskName: Message 1\n`,
			"Logged expected message");
		stderrWriteSpy.resetHistory();
	});
});

test.serial("Log ProjectBuild status", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new BuildLogger({
		projectName: "project.name",
		projectType: "project-type"
	});

	myLogger.setProjects(["project.a", "project.b"]);
	myLogger.skipProjectBuild("project.a");
	myLogger.startProjectBuild("project.b");
	myLogger.endProjectBuild("project.a");

	t.is(stderrWriteSpy.callCount, 1, "Logged one message");
	t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]), `${level} project-type project.name taskName: Message 1\n`,
		"Logged expected message");
});
