import Logger from "./Logger.js";

class BuildLogger extends Logger {
	#projectsToBuild;

	static BUILD_METADATA_EVENT_NAME = "ui5.build-metadata";
	static BUILD_STATUS_EVENT_NAME = "ui5.build-status";

	setProjects(projects) {
		if (!projects || !Array.isArray(projects)) {
			throw new Error("BuildLogger#setProjects: Missing or incorrect projects parameter");
		}
		this.#projectsToBuild = projects;

		this._emit(BuildLogger.BUILD_METADATA_EVENT_NAME, {
			projectsToBuild: projects
		});
	}

	startProjectBuild(projectName, projectType) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger#startProjectBuild: Unknown project ${projectName}`);
		}
		if (!projectType) {
			throw new Error(`BuildLogger#startProjectBuild: Missing projectType parameter`);
		}
		const level = "info";
		const hasListeners = this._emit(BuildLogger.BUILD_STATUS_EVENT_NAME, {
			level,
			projectName,
			projectType,
			status: "project-build-start",
		});
		if (!hasListeners) {
			this._log(level, `Building ${projectType} project ${projectName}...`);
		}
	}

	endProjectBuild(projectName, projectType) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger#endProjectBuild: Unknown project ${projectName}`);
		}
		if (!projectType) {
			throw new Error(`BuildLogger#endProjectBuild: Missing projectType parameter`);
		}
		const level = "verbose";
		const hasListeners = this._emit(BuildLogger.BUILD_STATUS_EVENT_NAME, {
			level,
			projectName,
			projectType,
			status: "project-build-end",
		});
		if (!hasListeners) {
			this._log(level, `Finished building ${projectType} project ${projectName}`);
		}
	}

	skipProjectBuild(projectName, projectType) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger#skipProjectBuild: Unknown project ${projectName}`);
		}
		if (!projectType) {
			throw new Error(`BuildLogger#skipProjectBuild: Missing projectType parameter`);
		}
		const level = "info";
		const hasListeners = this._emit(BuildLogger.BUILD_STATUS_EVENT_NAME, {
			level,
			projectName,
			projectType,
			status: "project-build-skip",
		});
		if (!hasListeners) {
			this._log(level, `Skipping build of ${projectType} project ${projectName}`);
		}
	}
}

export default BuildLogger;
