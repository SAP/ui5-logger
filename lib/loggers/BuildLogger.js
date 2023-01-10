import StandardLogger from "./StandardLogger.js";

class BuildLogger extends StandardLogger {
	#projectsToBuild;

	setProjects(projectsToBuild) {
		this.#projectsToBuild = projectsToBuild;

		this._emit("ui5.build-metadata", {
			projectsToBuild
		});
	}

	startProjectBuild(projectName, projectType) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger.startProjectBuild: Unknown project ${projectName}`);
		}
		const level = "info";
		const hasListeners = this._emit("ui5.build-status", {
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
			throw new Error(`BuildLogger.endProjectBuild: Unknown project ${projectName}`);
		}
		const level = "verbose";
		const hasListeners = this._emit("ui5.build-status", {
			level,
			projectName,
			projectType,
			status: "project-build-finish",
		});
		if (!hasListeners) {
			this._log(level, `Finished building ${projectType} project ${projectName}`);
		}
	}

	skipProjectBuild(projectName, projectType) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger.skipProjectBuild: Unknown project ${projectName}`);
		}
		const level = "info";
		const hasListeners = this._emit("ui5.build-status", {
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
