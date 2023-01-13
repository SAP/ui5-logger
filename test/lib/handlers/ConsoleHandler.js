import test from "ava";
import sinon from "sinon";
import stripAnsi from "strip-ansi";
import ConsoleHandler from "../../../lib/handlers/ConsoleHandler.js";
import Logger from "../../../lib/loggers/Logger.js";
import BuildLogger from "../../../lib/loggers/BuildLogger.js";
import ProjectBuildLogger from "../../../lib/loggers/ProjectBuildLogger.js";

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
	const myLogger = new Logger("my-module");

	Logger.LOG_LEVELS.forEach((level) => {
		if (level === "silent") {
			// Can't log silent messages
			return;
		}
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

test.serial("Log Build messages", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new BuildLogger("Builder");

	BuildLogger.LOG_LEVELS.forEach((level) => {
		if (level === "silent") {
			// Can't log silent messages
			return;
		}
		myLogger[level]("Message 1");
		if (level === "verbose") {
			// "verbose" is abbreviated
			level = "verb";
		}
		t.is(stderrWriteSpy.callCount, 1, "Logged one message");
		t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]), `${level} Builder: Message 1\n`,
			"Logged expected message");
		stderrWriteSpy.resetHistory();
	});
});

test.serial("Log Build status", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new BuildLogger("Builder");

	myLogger.setProjects(["project.a", "project.b"]);
	myLogger.skipProjectBuild("project.a");
	myLogger.startProjectBuild("project.b");
	myLogger.endProjectBuild("project.a");

	t.is(stderrWriteSpy.callCount, 3, "Logged one message");
	t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]),
		`info Project 1 of 2: ✔ Skipping build of undefined project project.a\n`,
		"Logged expected message");
	t.is(stripAnsi(stderrWriteSpy.getCall(1).args[0]),
		`info Project 2 of 2: ❯ Building undefined project project.b...\n`,
		"Logged expected message");
	t.is(stripAnsi(stderrWriteSpy.getCall(2).args[0]),
		`verb Project 1 of 2: ✔ Finished building undefined project project.a\n`,
		"Logged expected message");
});

test.serial("Log ProjectBuild messages", (t) => {
	const {stderrWriteSpy} = t.context;
	const myLogger = new ProjectBuildLogger({
		moduleName: "project-build",
		projectName: "project.name",
		projectType: "project-type"
	});

	ProjectBuildLogger.LOG_LEVELS.forEach((level) => {
		if (level === "silent") {
			// Can't log silent messages
			return;
		}
		myLogger[level]("Message 1");
		if (level === "verbose") {
			// "verbose" is abbreviated
			level = "verb";
		}
		t.is(stderrWriteSpy.callCount, 1, "Logged one message");
		t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]), `${level} project-build: Message 1\n`,
			"Logged expected message");
		stderrWriteSpy.resetHistory();
	});
});

test.serial("Log ProjectBuild status", (t) => {
	const {stderrWriteSpy} = t.context;

	// Make ConsoleHandler aware of the project first
	const buildLogger = new BuildLogger("Builder");
	buildLogger.setProjects(["project.a"]);

	const myLogger = new ProjectBuildLogger({
		moduleName: "build-module",
		projectName: "project.a",
		projectType: "project-type"
	});

	myLogger.setTasks(["task.a", "task.b"]);
	myLogger.startTask("task.a");
	myLogger.endTask("task.a");
	myLogger.startTask("task.b");
	myLogger.endTask("task.b");

	t.is(stderrWriteSpy.callCount, 4, "Logged one message");
	t.is(stripAnsi(stderrWriteSpy.getCall(0).args[0]),
		`info project.a Task 1 of 2 › Running task task.a...\n`,
		"Logged expected message");
	t.is(stripAnsi(stderrWriteSpy.getCall(1).args[0]),
		`verb project.a Task 1 of 2 ✔ Finished task task.a\n`,
		"Logged expected message");
	t.is(stripAnsi(stderrWriteSpy.getCall(2).args[0]),
		`info project.a Task 2 of 2 › Running task task.b...\n`,
		"Logged expected message");
	t.is(stripAnsi(stderrWriteSpy.getCall(3).args[0]),
		`verb project.a Task 2 of 2 ✔ Finished task task.b\n`,
		"Logged expected message");
});
