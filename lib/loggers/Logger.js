import {inspect} from "node:util";

// Module name must not contain any other characters than alphanumerical and some specials
const rIllegalModuleNameChars = /[^0-9a-zA-Z-_:@.]/i;

/**
 * Standard Logger
 *
 * @public
 * @class
 * @alias @ui5/logger/Logger
 */
class Logger {
	// Note: This is an ordered list of log levels.
	// The index of a level will be used to control which other levels are enabled or disabled.
	// Log level silent is special, as it suppresses all logging.
	static LOG_LEVELS = ["silly", "verbose", "perf", "info", "warn", "error", "silent"];

	static LOG_EVENT_NAME = "ui5.log";

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

	/**
	 *
	 *
	 * @public
	 * @param {string} moduleName
	 */
	constructor(moduleName) {
		if (!moduleName) {
			throw new Error("Logger: Missing moduleName parameter");
		}
		if (rIllegalModuleNameChars.test(moduleName)) {
			throw new Error(`Logger: Invalid module name: ${moduleName}`);
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
		const hasListeners = this._emit(Logger.LOG_EVENT_NAME, {
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
	if (logLevel === "silent") {
		// This level is to suppress any logging. Hence we do not provide a dedicated log-function
		return;
	}
	Logger.prototype[logLevel] = function(...args) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog(logLevel, message);
	};
});

export default Logger;
