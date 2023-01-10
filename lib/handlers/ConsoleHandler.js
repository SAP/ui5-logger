import chalk from "chalk";
import figures from "figures";
import {MultiBar} from "cli-progress";
import StandardLogger from "../loggers/StandardLogger.js";

class ConsoleHandler {
	#projectMetadata = new Map();
	#multibar;
	#progressBar;

	constructor() {
		this._handleLogEvent = this.#handleLogEvent.bind(this);
		this._handleBuildStatusEvent = this.#handleBuildStatusEvent.bind(this);
		this._handleProjectBuildStatusEvent = this.#handleProjectBuildStatusEvent.bind(this);
		this._handleBuildMetadataEvent = this.#handleBuildMetadataEvent.bind(this);
		this._handleProjectBuildMetadataEvent = this.#handleProjectBuildMetadataEvent.bind(this);

		this.#multibar = new MultiBar({
			format: `${chalk.grey("{bar}")} {message}`,
			hideCursor: true,
			barCompleteChar: figures.square,
			barIncompleteChar: figures.squareLightShade,

			// barCompleteChar: figures.circleFilled,
			// barIncompleteChar: figures.circleDotted,
			// barGlue: figures.circle,

			// only the bars will be cleared, not the logged content
			clearOnComplete: true,
			stopOnComplete: true,

			// important! redraw everything to avoid "empty" completed bars
			forceRedraw: true,

			gracefulExit: false
		});
		this.#progressBar = this.#multibar.create(1, 0, {message: ""});

		this.enable();
	}

	enable() {
		process.on("ui5.log", this._handleLogEvent);
		process.on("ui5.build-status", this._handleBuildStatusEvent);
		process.on("ui5.project-build-status", this._handleProjectBuildStatusEvent);
		process.on("ui5.build-metadata", this._handleBuildMetadataEvent);
		process.on("ui5.project-build-metadata", this._handleProjectBuildMetadataEvent);
	}

	disable() {
		process.off("ui5.log", this._handleLogEvent);
		process.off("ui5.build-status", this._handleBuildStatusEvent);
		process.off("ui5.project-build-status", this._handleProjectBuildStatusEvent);
		process.off("ui5.build-metadata", this._handleBuildMetadataEvent);
		process.off("ui5.project-build-metadata", this._handleProjectBuildMetadataEvent);
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
		this.#multibar.log(message + "\n");
	}

	#handleBuildMetadataEvent({projectsToBuild}) {
		projectsToBuild.forEach((projectName) => {
			this.#projectMetadata.set(projectName, {
				buildStarted: false,
				buildSkipped: false,
				buildFinished: false,
				buildStartIndex: null,
				projectTasks: new Map(),
			});
		});

		this.#progressBar.setTotal(this.#projectMetadata.size, {message: ""});
	}

	#handleProjectBuildMetadataEvent({tasksToRun, projectName, projectType}) {
		const projectMetadata = this.#getProjectMetadata(projectName);
		tasksToRun.forEach((taskName) => {
			projectMetadata.projectTasks.set(taskName, {
				executionStarted: false,
				executionFinished: false,
				executionStartIndex: null,
			});
		});
	}

	#getProjectMetadata(projectName) {
		const projectMetadata = this.#projectMetadata.get(projectName);
		if (!projectMetadata) {
			throw new Error(`Unknown project ${projectName}`);
		}
		return projectMetadata;
	}

	#handleBuildStatusEvent({level, projectName, projectType, status}) {
		const levelPrefix = this.#getLevelPrefix(level);

		const projectMetadata = this.#getProjectMetadata(projectName);
		if (projectMetadata.buildStartIndex === null) {
			let nextIdx = 1;
			this.#projectMetadata.forEach((metadata) => {
				if (metadata.buildStartIndex !== null && metadata.buildStartIndex >= nextIdx) {
					nextIdx = metadata.buildStartIndex + 1;
				}
			});
			projectMetadata.buildStartIndex = nextIdx;
		}
		const buildIndex = `(${projectMetadata.buildStartIndex}/${this.#projectMetadata.size})`;

		let message;
		switch (status) {
		case "project-build-start":
			projectMetadata.buildStarted = true;
			message = `${chalk.blue(figures.pointer)} ${buildIndex} ` +
				`Building ${projectType} project ${chalk.bold(projectName)}...`;
			this.#progressBar.update({message});
			break;
		case "project-build-finish":
			projectMetadata.buildFinished = true;
			message = `${chalk.green(figures.tick)} ${buildIndex} ` +
				`Finished building ${projectType} project ${chalk.bold(projectName)}`;
			this.#progressBar.increment();
			break;
		case "project-build-skip":
			projectMetadata.buildSkipped = true;
			message = `${chalk.blue(figures.circleDotted)} ${buildIndex} ` +
				`Skipping build of ${projectType} project ${chalk.bold(projectName)}`;
			break;
		default:
			break;
		}
		if (message && StandardLogger.isLevelEnabled(level)) {
			this.#logMessage(`${levelPrefix} ${chalk.blue("build")}: ${message}`);
		}
	}

	#handleProjectBuildStatusEvent({level, projectName, projectType, taskName, status}) {
		const levelPrefix = this.#getLevelPrefix(level);

		const {projectTasks} = this.#getProjectMetadata(projectName);
		const taskMetadata = projectTasks.get(taskName);
		if (taskMetadata.executionStartIndex === null) {
			let nextIdx = 1;
			projectTasks.forEach((metadata) => {
				if (metadata.executionStartIndex !== null && metadata.executionStartIndex >= nextIdx) {
					nextIdx = metadata.executionStartIndex + 1;
				}
			});
			taskMetadata.executionStartIndex = nextIdx;
		}
		const taskIndex = `(${taskMetadata.executionStartIndex}/${projectTasks.size})`;

		let message;
		switch (status) {
		case "task-start":
			message = `${chalk.blue(figures.pointerSmall)} ${taskIndex} Running task ${chalk.bold(taskName)}...`;
			break;
		case "task-finish":
			// message = `${chalk.green(figures.tick)} ${taskIndex} Finished task ${taskName}`;
			break;
		default:
			break;
		}
		if (message && StandardLogger.isLevelEnabled(level)) {
			this.#logMessage(
				`${levelPrefix} ${chalk.blue(`build: ${projectType} ${chalk.bold(projectName)}`)} ${message}`);
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
