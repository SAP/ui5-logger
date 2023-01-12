import {inspect} from "node:util";

const rAllowedModuleName = /[0-9a-zA-Z-_:@.]/i;

class Logger {
	// Note: This is an ordered list of log levels.
	// The index of a level will be used to control which other levels are enabled or disabled
	static LOG_LEVELS = ["silly", "verbose", "perf", "info", "warn", "error", "silent"];

	static setLevel(levelName) {
		process.env.UI5_LOG_LVL = levelName;
	}

	static isLevelEnabled(levelName) {
		const currIdx = Logger.LOG_LEVELS.indexOf(Logger.#getCurrentLogLevel());
		const reqIdx = Logger.LOG_LEVELS.indexOf(levelName);
		if (reqIdx === -1) {
			throw new Error(`Unknown log level "${levelName}"`);
		}
		return reqIdx >= currIdx;
	}

	static #getCurrentLogLevel() {
		if (process.env.UI5_LOG_LVL) {
			// Check whether set log level is valid
			const levelName = process.env.UI5_LOG_LVL;
			if (!Logger.LOG_LEVELS.includes(levelName)) {
				throw new Error(
					`UI5 Logger: Environment variable UI5_LOG_LVL is set to an unknown log level "${levelName}". ` +
					`Valid levels are ${Logger.LOG_LEVELS.join(", ")}`);
			}
			return levelName;
		} else {
			return "info";
		}
	}

	static _formatMessage(message) {
		if (typeof message === "string" || message instanceof String) {
			return message;
		}
		return inspect(message, {
			depth: 3,
			compact: 2,
		});
	}

	#moduleName;

	constructor(moduleName) {
		if (!moduleName) {
			throw new Error("StandardLogger: Missing moduleName parameter");
		}
		if (!rAllowedModuleName.test(moduleName)) {
			throw new Error(`StandardLogger: Invalid module name: ${moduleName}`);
		}
		this.#moduleName = moduleName;
	}

	isLevelEnabled(levelName) {
		return Logger.isLevelEnabled(levelName);
	}

	_emit(eventName, payload) {
		return process.emit(eventName, payload);
	}

	_log(level, message) {
		if (this.isLevelEnabled(level)) {
			console.log(`[${level}] ${message}`);
		}
	}

	_emitOrLog(level, message) {
		const hasListeners = this._emit("ui5.log", {
			level,
			message,
			moduleName: this.#moduleName,
		});
		if (!hasListeners) {
			this._log(level, `${this.#moduleName}: ${message}`);
		}
	}
}

Logger.LOG_LEVELS.forEach((logLevel) => {
	Logger.prototype[logLevel] = function(...args) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog(logLevel, message);
	};
});

export default Logger;
