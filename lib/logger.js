import npmlog from "npmlog";

const levels = ["silly", "verbose", "perf", "info", "warn", "error", "silent"];
if (process.env.UI5_LOG_LVL) {
	const logLvl = process.env.UI5_LOG_LVL;
	if (!levels.includes(logLvl)) {
		throw new Error(`UI5 Logger: Environment variable UI5_LOG_LVL is set to an unknown log level "${logLvl}". ` +
			`Valid levels are ${levels.join(", ")}`);
	}
	npmlog.level = logLvl;
} else {
	npmlog.level = "info"; // Our default
}

npmlog.enableUnicode(); // TODO: Check whether unicode is actually supported
npmlog.prefixStyle = {fg: "blue"};
npmlog.headingStyle = {fg: "white", bg: "black"};

// Verbose is at level 1000, info at 2000
npmlog.addLevel("perf", 1500, {fg: "white", bg: "red"}, "PERF");

npmlog.on("error", (err) => {
	console.log(err);
});

class Logger {
	constructor(moduleName) {
		this._moduleName = moduleName;
		this._logger = npmlog;
	}

	static isLevelEnabled(levelName) {
		const currIdx = levels.indexOf(npmlog.level);
		const reqIdx = levels.indexOf(levelName);
		if (currIdx === -1) {
			throw new Error(`Failed to find current log level "${npmlog.level}" in list of expected log levels`);
		}
		if (reqIdx === -1) {
			throw new Error(`Unknown log level "${levelName}"`);
		}
		if (reqIdx >= currIdx) {
			return true;
		} else {
			return false;
		}
	}

	isLevelEnabled(levelName) {
		return Logger.isLevelEnabled(levelName);
	}

	silly(...messages) {
		return this._logger.silly(this._moduleName, ...messages);
	}

	verbose(...messages) {
		return this._logger.verbose(this._moduleName, ...messages);
	}

	perf(...messages) {
		return this._logger.perf(this._moduleName, ...messages);
	}

	info(...messages) {
		return this._logger.info(this._moduleName, ...messages);
	}

	warn(...messages) {
		return this._logger.warn(this._moduleName, ...messages);
	}

	error(...messages) {
		return this._logger.error(this._moduleName, ...messages);
	}

	_getLogger() {
		return this._logger;
	}
}

class GroupLogger extends Logger {
	constructor(moduleName, weight = 0, parentLogger) {
		super(moduleName);

		if (parentLogger) {
			this._logger = parentLogger._getLogger().newGroup("", weight);
		} else {
			this._logger = npmlog.newGroup("", weight);
		}
	}

	createSubLogger(name, weight) {
		return new GroupLogger(this._moduleName + " " + name, weight, this);
	}

	createTaskLogger(name, todo, weight) {
		return new TaskLogger(this._moduleName + " " + name, todo, weight, this);
	}
}


class TaskLogger extends Logger {
	constructor(moduleName, todo, weight, parentLogger) {
		super(moduleName);
		this._todo = todo || 0;
		this._completed = 0;

		if (parentLogger) {
			this._logger = parentLogger._getLogger().newItem("", todo, weight);
		} else {
			this._logger = npmlog.newItem(this._moduleName, todo, weight);
		}
	}

	addWork(todo) {
		this._logger.addWork(todo);
		this._todo += todo;
	}

	startWork(...messages) {
		// Current job number is completed + 1
		this.info(`(${this._completed + 1}/${this._todo})`, ...messages);
	}

	completeWork(completed) {
		this._completed += completed;
		this._logger.completeWork(completed);
	}

	finish() {
		return this._logger.finish();
	}
}

export function getLogger(moduleName) {
	return new Logger(moduleName);
}

export function	getGroupLogger(moduleName) {
	return new GroupLogger(moduleName);
}

export function	setLevel(level) {
	if (!levels.includes(level)) {
		throw new Error(`Unknown log level "${level}"`);
	}
	return npmlog.level = level;
}

export function isLevelEnabled(levelName) {
	return Logger.isLevelEnabled(levelName);
}

export function	setShowProgress(showProgress) {
	if (showProgress) {
		npmlog.enableProgress();
	} else {
		npmlog.disableProgress();
	}
}

// Export internal classes for testing only
// TODO: Move Logger classes into separate files so that they can be directly imported from tests
/* istanbul ignore else */
if (process.env.NODE_ENV === "test") {
	getLogger.__test__ = {
		Logger, GroupLogger, TaskLogger
	};
}
