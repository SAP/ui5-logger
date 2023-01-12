import Logger from "./Logger.js";

class ProjectBuildLogger extends Logger {
	#projectName;
	#projectType;
	#tasksToRun;

	constructor({moduleName, projectName, projectType}) {
		super(moduleName);
		this.#projectName = projectName;
		this.#projectType = projectType;
	}

	setTasks(tasksToRun) {
		this.#tasksToRun = tasksToRun;

		this._emit("ui5.project-build-metadata", {
			projectName: this.#projectName,
			projectType: this.#projectType,
			tasksToRun
		});
	}

	startTask(taskName) {
		if (!this.#tasksToRun || !this.#tasksToRun.includes(taskName)) {
			throw new Error(`ProjectBuildLogger.startTask: Unknown task ${taskName}`);
		}
		const level = "info";
		const hasListeners = this._emit("ui5.project-build-status", {
			level,
			projectName: this.#projectName,
			projectType: this.#projectType,
			taskName,
			status: "task-start",
		});

		if (!hasListeners) {
			this._log(level, `${this.#projectName}: Running task ${taskName}...`);
		}
	}

	endTask(taskName) {
		if (!this.#tasksToRun || !this.#tasksToRun.includes(taskName)) {
			throw new Error(`ProjectBuildLogger.endTask: Unknown task ${taskName}`);
		}
		const level = "verbose";
		const hasListeners = this._emit("ui5.project-build-status", {
			level,
			projectName: this.#projectName,
			projectType: this.#projectType,
			taskName,
			status: "task-finish",
		});

		if (!hasListeners) {
			this._log(level, `${this.#projectName}: Finished task ${taskName}`);
		}
	}
}

export default ProjectBuildLogger;
