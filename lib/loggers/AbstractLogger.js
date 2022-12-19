class AbstractLogger {
	_emit(eventName, payload) {
		return process.emit(eventName, payload);
	}

	_log(level, message) {
		if (this.isLevelEnabled(level)) {
			console.log(`[${level}] ${message}`);
		}
	}

	_emitOrLog() {
		throw new Error(`Method _emitOrLog must be implemented in subclass`);
	}

	isLevelEnabled(levelName) {
		return AbstractLogger.isLevelEnabled(levelName);
	}

	static LOG_LEVELS = ["silly", "verbose", "perf", "info", "warn", "error", "silent"];

	static setLevel(levelName) {
		process.env.UI5_LOG_LVL = levelName;
	}

	static isLevelEnabled(levelName) {
		const currIdx = AbstractLogger.LOG_LEVELS.indexOf(AbstractLogger.#getCurrentLogLevel());
		const reqIdx = AbstractLogger.LOG_LEVELS.indexOf(levelName);
		if (reqIdx === -1) {
			throw new Error(`Unknown log level "${levelName}"`);
		}
		if (reqIdx >= currIdx) {
			return true;
		} else {
			return false;
		}
	}

	static #getCurrentLogLevel() {
		if (process.env.UI5_LOG_LVL) {
			// Check whether set log level is valid
			const levelName = process.env.UI5_LOG_LVL;
			if (!AbstractLogger.LOG_LEVELS.includes(levelName)) {
				throw new Error(
					`UI5 Logger: Environment variable UI5_LOG_LVL is set to an unknown log level "${levelName}". ` +
					`Valid levels are ${AbstractLogger.LOG_LEVELS.join(", ")}`);
			}
			return levelName;
		} else {
			return "info";
		}
	}
}

AbstractLogger.LOG_LEVELS.forEach((logLevel) => {
	AbstractLogger.prototype[logLevel] = function(message1, message2) {
		let message = message1;
		// TODO: Format messages to strings in case they complex types
		if (message2) {
			message += ` ${message2}`;
		}
		this._emitOrLog(logLevel, `${message}`);
	};
});

export default AbstractLogger;
