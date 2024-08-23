import Logger, {LogLevel, LoggerPayload} from "./Logger.js";

export interface ProjectBuildMetadataEvent extends LoggerPayload {
	projectName: string;
	projectType: string;
	tasksToRun: string[];
};

export interface ProjectBuildStatusEvent extends LoggerPayload {
	level: LogLevel;
	moduleName: string;
	projectName: string;
	projectType: string;
	taskName: string;
	status: "task-start" | "task-end";
};
/**
 * Logger for emitting status events on the progress a single project's build process.
 * <br><br>
 * Emits <code>ui5.log</code>, <code>ui5.project-build-metadata</code> and <code>ui5.project-build-status</code>
 * events on the [<code>process</code>]{@link https://nodejs.org/api/process.html} object,
 * which can be handled by dedicated writers,
 * like [@ui5/logger/writers/Console]{@link @ui5/logger/writers/Console}.
 * <br><br>
 * If no listener is attached to the the event, messages are written directly to the <code>process.stderr</code> stream.
 *
 * @private
 * @class
 * @alias @ui5/logger/loggers/ProjectBuild
 */
class ProjectBuild extends Logger {
	#projectName;
	#projectType;
	#tasksToRun: string[] | undefined;

	static PROJECT_BUILD_METADATA_EVENT_NAME = "ui5.project-build-metadata";
	static PROJECT_BUILD_STATUS_EVENT_NAME = "ui5.project-build-status";

	constructor({moduleName, projectName, projectType}:
		{moduleName: string; projectName: string; projectType: string}) {
		super(moduleName);

		if (!projectName) {
			throw new Error("loggers/ProjectBuild: Missing projectName parameter");
		}
		if (!projectType) {
			throw new Error("loggers/ProjectBuild: Missing projectType parameter");
		}
		this.#projectName = projectName;
		this.#projectType = projectType;
	}

	setTasks(tasks: string[]) {
		if (!tasks || !Array.isArray(tasks)) {
			throw new Error("loggers/ProjectBuild#setTasks: Missing or incorrect tasks parameter");
		}
		this.#tasksToRun = tasks;

		this._emit(ProjectBuild.PROJECT_BUILD_METADATA_EVENT_NAME, {
			projectName: this.#projectName,
			projectType: this.#projectType,
			tasksToRun: tasks,
		} as ProjectBuildMetadataEvent);
	}

	startTask(taskName: string) {
		if (!this.#tasksToRun || !this.#tasksToRun.includes(taskName)) {
			throw new Error(`loggers/ProjectBuild#startTask: Unknown task ${taskName}`);
		}
		const level = "info";
		const hasListeners = this._emit(ProjectBuild.PROJECT_BUILD_STATUS_EVENT_NAME, {
			level,
			projectName: this.#projectName,
			projectType: this.#projectType,
			taskName,
			status: "task-start",
		} as ProjectBuildStatusEvent);

		if (!hasListeners) {
			this._log(level, `${this.#projectName}: Running task ${taskName}...`);
		}
	}

	endTask(taskName: string) {
		if (!this.#tasksToRun || !this.#tasksToRun.includes(taskName)) {
			throw new Error(`loggers/ProjectBuild#endTask: Unknown task ${taskName}`);
		}
		const level = "verbose";
		const hasListeners = this._emit(ProjectBuild.PROJECT_BUILD_STATUS_EVENT_NAME, {
			level,
			projectName: this.#projectName,
			projectType: this.#projectType,
			taskName,
			status: "task-end",
		} as ProjectBuildStatusEvent);

		if (!hasListeners) {
			this._log(level, `${this.#projectName}: Finished task ${taskName}`);
		}
	}
}

export default ProjectBuild;
