import Logger, {LogLevel, LoggerPayload} from "./Logger.js";

export interface BuildMetadataEvent extends LoggerPayload {
	projectsToBuild: string[];
};

export interface BuildStatusEvent extends LoggerPayload {
	level: LogLevel;
	message: string;
	moduleName: string;
	projectName: string;
	projectType: string;
	status: "project-build-start" | "project-build-end" | "project-build-skip";
};

/**
 * Logger for emitting status events on the progress a UI5 Tooling build process.
 * <br><br>
 * Emits <code>ui5.log</code>, <code>ui5.build-metadata</code> and <code>ui5.build-status</code> events on the
 * [<code>process</code>]{@link https://nodejs.org/api/process.html} object, which can which can be handled
 * by dedicated writers, like [@ui5/logger/writers/Console]{@link @ui5/logger/writers/Console}.
 * <br><br>
 * If no listener is attached to the the event, messages are written directly to the <code>process.stderr</code> stream.
 *
 * @private
 * @class
 * @alias @ui5/logger/loggers/Build
 */
class Build extends Logger {
	#projectsToBuild: string[] | undefined;

	static BUILD_METADATA_EVENT_NAME = "ui5.build-metadata";
	static BUILD_STATUS_EVENT_NAME = "ui5.build-status";

	setProjects(projects: string[]) {
		if (!projects || !Array.isArray(projects)) {
			throw new Error("loggers/Build#setProjects: Missing or incorrect projects parameter");
		}
		this.#projectsToBuild = projects;

		this._emit(Build.BUILD_METADATA_EVENT_NAME, {
			projectsToBuild: projects,
		} as BuildMetadataEvent);
	}

	startProjectBuild(projectName: string, projectType: string) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`loggers/Build#startProjectBuild: Unknown project ${projectName}`);
		}
		if (!projectType) {
			throw new Error(`loggers/Build#startProjectBuild: Missing projectType parameter`);
		}
		const level = "info";
		const hasListeners = this._emit(Build.BUILD_STATUS_EVENT_NAME, {
			level,
			projectName,
			projectType,
			status: "project-build-start",
		} as BuildStatusEvent);
		if (!hasListeners) {
			this._log(level, `Building ${projectType} project ${projectName}...`);
		}
	}

	endProjectBuild(projectName: string, projectType: string) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`loggers/Build#endProjectBuild: Unknown project ${projectName}`);
		}
		if (!projectType) {
			throw new Error(`loggers/Build#endProjectBuild: Missing projectType parameter`);
		}
		const level = "verbose";
		const hasListeners = this._emit(Build.BUILD_STATUS_EVENT_NAME, {
			level,
			projectName,
			projectType,
			status: "project-build-end",
		} as BuildStatusEvent);
		if (!hasListeners) {
			this._log(level, `Finished building ${projectType} project ${projectName}`);
		}
	}

	skipProjectBuild(projectName: string, projectType: string) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`loggers/Build#skipProjectBuild: Unknown project ${projectName}`);
		}
		if (!projectType) {
			throw new Error(`loggers/Build#skipProjectBuild: Missing projectType parameter`);
		}
		const level = "info";
		const hasListeners = this._emit(Build.BUILD_STATUS_EVENT_NAME, {
			level,
			projectName,
			projectType,
			status: "project-build-skip",
		} as BuildStatusEvent);
		if (!hasListeners) {
			this._log(level, `Skipping build of ${projectType} project ${projectName}`);
		}
	}
}

export default Build;
