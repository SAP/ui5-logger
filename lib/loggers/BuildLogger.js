import StandardLogger from "./StandardLogger.js";

class BuildLogger extends StandardLogger {
	#projectsToBuild;

	setProjects(projectsToBuild) {
		this.#projectsToBuild = projectsToBuild;

		this._emit("ui5-build-status", {
			projectsToBuild
		});
	}

	startProjectBuild(projectName) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger.startProjectBuild: Unknown project ${projectName}`);
		}
		this._emit("ui5-build-status", {
			projectName,
			status: "project-build-start",
		});
	}

	skipProjectBuild(projectName) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger.skipProjectBuild: Unknown project ${projectName}`);
		}
		this._emit("ui5-build-status", {
			projectName,
			status: "project-build-skip",
		});
	}

	endProjectBuild(projectName) {
		if (!this.#projectsToBuild || !this.#projectsToBuild.includes(projectName)) {
			throw new Error(`BuildLogger.endProjectBuild: Unknown project ${projectName}`);
		}
		this._emit("ui5-project-build-status", {
			projectName,
			status: "project-build-end",
		});
	}
}

export default BuildLogger;
