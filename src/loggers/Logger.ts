import process from "node:process";
import {inspect} from "node:util";

// Module name must not contain any other characters than alphanumerical and some specials
const rIllegalModuleNameChars = /[^0-9a-zA-Z-_:@./]/i;

export type LogLevel = typeof Logger.LOG_LEVELS[number];
export type LoggerPayload = object;

export interface LogEvent extends LoggerPayload {
	level: LogLevel;
	message: string;
	moduleName: string;
};

type LogLevelMethods = {
	[level in LogLevel]: (...args: unknown[]) => void;
};

/**
 * Standard logging module for UI5 Tooling and extensions.
 * <br><br>
 * Emits <code>ui5.log</code> events on the [<code>process</code>]{@link https://nodejs.org/api/process.html} object,
 * which can be handled by dedicated writers,
 * like [@ui5/logger/writers/Console]{@link @ui5/logger/writers/Console}.
 * <br><br>
 * If no listener is attached to an event, messages are written directly to the <code>process.stderr</code> stream.
 *
 */
class Logger implements LogLevelMethods {
	/**
	 * Available log levels, ordered by priority:
	 * <br>
	 * <ol>
	 *   <li>silly</li>
	 *   <li>verbose</li>
	 *   <li>perf</li>
	 *   <li>info <i>(default)</i></li>
	 *   <li>warn</li>
	 *   <li>error</li>
	 *   <li>silent</li>
	 * </ol>
	 *
	 * Log level <code>silent</code> is special in the sense that no messages can be submitted with that level.
	 * It can be used to suppress all logging.
	 */
	static LOG_LEVELS = ["silly", "verbose", "perf", "info", "warn", "error", "silent"] as const;

	/**
	 * Event name used for emitting new log-message event on the
	 * [<code>process</code>]{@link https://nodejs.org/api/process.html} object
	 */
	static LOG_EVENT_NAME = "ui5.log";

	/**
	 * Sets the standard log level.
	 * <br>
	 * <b>Example:</b> Setting it to <code>perf</code> would suppress all <code>silly</code> and <code>verbose</code>
	 * logging, and only show <code>perf</code>, <code>info</code>, <code>warn</code> and <code>error</code> logs.
	 *
	 * @param levelName New log level
	 */
	static setLevel(this: void, levelName: string) {
		process.env.UI5_LOG_LVL = levelName;
	}

	/**
	 * Gets the current log level
	 *
	 * @returns The current log level. Defaults to <code>info</code>
	 */
	static getLevel(this: void) {
		if (process.env.UI5_LOG_LVL) {
			// Check whether set log level is valid
			const levelName = process.env.UI5_LOG_LVL as LogLevel;
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

	/**
	 * Tests whether the provided log level is enabled by the current log level
	 *
	 * @param levelName Log level to test
	 * @returns True if the provided level is enabled
	 */
	static isLevelEnabled(this: void, levelName: LogLevel) {
		const currIdx = Logger.LOG_LEVELS.indexOf(Logger.getLevel());
		const reqIdx = Logger.LOG_LEVELS.indexOf(levelName);
		if (reqIdx === -1) {
			throw new Error(`Unknown log level "${levelName}"`);
		}
		return reqIdx >= currIdx;
	}

	/**
	 * Formats a given parameter into a string
	 *
	 * @param message Single log message parameter passed by a program
	 * @returns String representation for the given message
	 */
	static _formatMessage(this: void, message: unknown) {
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
	 * @param moduleName Identifier for messages created by this logger.
	 * Example: <code>module:submodule:Class</code>
	 */
	constructor(moduleName: string) {
		if (!moduleName) {
			throw new Error("Logger: Missing moduleName parameter");
		}
		if (rIllegalModuleNameChars.test(moduleName)) {
			throw new Error(`Logger: Invalid module name: ${moduleName}`);
		}
		this.#moduleName = moduleName;
	}

	/**
	 * Tests whether the provided log level is enabled by the current log level
	 *
	 * @param levelName Log level to test
	 * @returns True if the provided level is enabled
	 */
	isLevelEnabled(levelName: LogLevel) {
		return Logger.isLevelEnabled(levelName);
	}

	_emit(eventName: string, payload: LoggerPayload) {
		return (process.emit as (eventName: string, payload: LoggerPayload) => boolean)(eventName, payload);
	}

	_log(level: LogLevel, message: string) {
		if (this.isLevelEnabled(level)) {
			process.stderr.write(`[${level}] ${message}\n`);
		}
	}

	_emitOrLog(level: LogLevel, message: string) {
		const hasListeners = this._emit(Logger.LOG_EVENT_NAME, {
			level,
			message,
			moduleName: this.#moduleName,
		} as LogEvent);
		if (!hasListeners) {
			this._log(level, `${this.#moduleName}: ${message}`);
		}
	}

	/**
	 * Create a log entry with the <code>silly</code> level
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	silly(...args: unknown[]) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog("silly", message);
	};

	/**
	 * Create a log entry with the <code>verbose</code> level
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	verbose(...args: unknown[]) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog("verbose", message);
	};

	/**
	 * Create a log entry with the <code>perf</code> level
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	perf(...args: unknown[]) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog("perf", message);
	};

	/**
	 * Create a log entry with the <code>info</code> level
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	info(...args: unknown[]) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog("info", message);
	};

	/**
	 * Create a log entry with the <code>warn</code> level
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	warn(...args: unknown[]) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog("warn", message);
	};

	/**
	 * Create a log entry with the <code>error</code> level
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	error(...args: unknown[]) {
		const message = args.map(Logger._formatMessage).join(" ");
		this._emitOrLog("error", message);
	};

	/**
	 * Create a log entry with the <code>silent</code> level. These messages will not be shown.
	 *
	 * @param args Messages to log. An automatic string conversion is applied if necessary
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	silent(...args: unknown[]) {
		// This level is to suppress any logging. Hence we do not provide a dedicated log-function
		return;
	};
}

export default Logger;
