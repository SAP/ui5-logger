import AbstractLogger from "./AbstractLogger.js";
// log to process.emit("ui5-log") or process.emit("ui5-log-project")
// Introduce handlers, ConsoleHandler (logs to console), CustomHandler (with callback)
// Set env variable "UI5_emitOrLog_LVL" also from UI5 CL

const rAllowedModuleName = /[0-9a-zA-Z-_:@.]/i;

class StandardLogger extends AbstractLogger {
	#moduleName;

	constructor(moduleName) {
		super();
		if (!moduleName) {
			throw new Error("Missing moduleName parameter");
		}
		if (!rAllowedModuleName.test(moduleName)) {
			throw new Error(`Invalid module name: ${moduleName}`);
		}
		this.#moduleName = moduleName;
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

export default StandardLogger;
