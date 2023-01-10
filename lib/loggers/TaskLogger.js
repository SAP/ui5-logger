import AbstractLogger from "./AbstractLogger.js";

class ProjectBuildLogger extends AbstractLogger {
	#projectName;
	#projectType;
	#taskName;

	constructor({projectName, projectType, taskName}) {
		super();
		this.#projectName = projectName;
		this.#projectType = projectType;
		this.#taskName = taskName;
	}

	_emitOrLog(level, message) {
		const hasListeners = this._emit("ui5.log", {
			level,
			message,
			moduleName: "build",
			projectName: this.#projectName,
			projectType: this.#projectType,
			taskName: this.#taskName,
		});
		if (!hasListeners) {
			this._log(level, `${this.#projectType} ${this.#projectName} - ${this.#taskName}: ${message}`);
		}
	}
}

export default ProjectBuildLogger;
