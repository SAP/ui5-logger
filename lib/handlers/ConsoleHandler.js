import chalk from "chalk";
import StandardLogger from "../loggers/StandardLogger.js";

class ConsoleHandler {
	constructor() {
		this._handleLogEvent = this.#handleLogEvent.bind(this);
		this._handleBuildStatusEvent = this.#handleBuildStatusEvent.bind(this);
		this._handleProjectBuildStatusEvent = this.#handleProjectBuildStatusEvent.bind(this);

		this.enable();
	}

	enable() {
		process.on("ui5-log", this._handleLogEvent);
		process.on("ui5-build-status", this._handleBuildStatusEvent);
		process.on("ui5-project-build-status", this._handleProjectBuildStatusEvent);
	}

	disable() {
		process.off("ui5-log", this._handleLogEvent);
		process.off("ui5-build-status", this._handleBuildStatusEvent);
		process.off("ui5-project-build-status", this._handleProjectBuildStatusEvent);
	}

	#handleLogEvent({level, message, moduleName, projectName, projectType, taskName}) {
		if (!StandardLogger.isLevelEnabled(level)) {
			return;
		}
		const levelPrefix = this.#getLevelPrefix(level);
		let messagePrefix;
		if (projectName && projectType) {
			messagePrefix = `${projectType} ${chalk.bold(projectName)}`;
			if (taskName) {
				messagePrefix += ` ${taskName}`;
			}
		} else {
			messagePrefix = moduleName;
		}
		this.#logMessage(`${levelPrefix} ${chalk.blue(messagePrefix)}: ${message}`);
	}

	#logMessage(message) {
		process.stdout.write(message + "\n");
	}

	#handleBuildStatusEvent({projectName, projectType, taskName, status}) {
		switch (status) {
		case "project-build-start":
			break;
		case "project-build-end":
			break;
		case "project-build-skip":
			break;
		default:
			break;
		}
	}

	#handleProjectBuildStatusEvent({projectName, projectType, taskName, status}) {
		switch (status) {
		case "task-start":
			break;
		case "task-end":
			break;
		default:
			break;
		}
	}

	#getLevelPrefix(level) {
		switch (level) {
		case "silly":
			return chalk.inverse(level);
		case "verbose":
			return chalk.cyan("verb");
		case "perf":
			return chalk.bgYellow.red(level);
		case "info":
			return chalk.green(level);
		case "warn":
			return chalk.yellow(level);
		case "error":
			return chalk.bgRed.white(level);
		case "silent":
			return chalk.white(level);
		default:
			return level;
		}
	}

	static init() {
		return new ConsoleHandler();
	}
}

export default ConsoleHandler;
