import {chalkStderr as chalk} from "chalk";
import figures from "figures";
import {MultiBar} from "cli-progress";
import StandardLogger from "../loggers/StandardLogger.js";

class ConsoleHandler {
	#projectMetadata = new Map();
	#multibar;
	#progressBar;
	#progressBarProjectWeight;

	constructor() {
		this._handleLogEvent = this.#handleLogEvent.bind(this);
		this._handleBuildStatusEvent = this.#handleBuildStatusEvent.bind(this);
		this._handleProjectBuildStatusEvent = this.#handleProjectBuildStatusEvent.bind(this);
		this._handleBuildMetadataEvent = this.#handleBuildMetadataEvent.bind(this);
		this._handleProjectBuildMetadataEvent = this.#handleProjectBuildMetadataEvent.bind(this);

		this.enable();
	}

	enable() {
		process.on("ui5.log", this._handleLogEvent);
		process.on("ui5.build-metadata", this._handleBuildMetadataEvent);
		process.on("ui5.project-build-metadata", this._handleProjectBuildMetadataEvent);
		process.on("ui5.build-status", this._handleBuildStatusEvent);
		process.on("ui5.project-build-status", this._handleProjectBuildStatusEvent);
	}

	disable() {
		process.off("ui5.log", this._handleLogEvent);
		process.off("ui5.build-metadata", this._handleBuildMetadataEvent);
		process.off("ui5.project-build-metadata", this._handleProjectBuildMetadataEvent);
		process.off("ui5.build-status", this._handleBuildStatusEvent);
		process.off("ui5.project-build-status", this._handleProjectBuildStatusEvent);
		if (this.#multibar) {
			this.#multibar.stop();
		}
	}

	/*
	 * Progress bar is only required when building projects. So we create it lazily
	 */
	#getProgressBar() {
		if (!this.#multibar) {
			this.#multibar = new MultiBar({
				format: `{bar} {message}`,
				barsize: 20,
				linewrap: true,
				emptyOnZero: 0,
				hideCursor: true,

				// Graceful exit is required to ensure all terminal settings (e.g. hideCursor)
				// are restored on SIGINT
				gracefulExit: true,

				// Required to prevent flickering when logging
				forceRedraw: true,

				clearOnComplete: true,
				stopOnComplete: true,

				barCompleteChar: figures.square,
				barIncompleteChar: figures.squareLightShade,
			});

			// Initialize empty progress bar to enable logging through the multibar instance
			this.#progressBar = this.#multibar.create(0, 0, {message: ""});

			this.#multibar.on("stop", () => {
				// Progress bar has finished and will remove itself from the output.
				// Therefore, further logging needs to be done to process.stderr. Otherwise it would disappear.
				// Also, we can de-reference the instances now
				this.#multibar = null;
				this.#progressBar = null;
			});
		}
		return this.#progressBar;
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
		if (this.#multibar) {
			// If a progress bar is in use, we have to log through it's API
			this.#multibar.log(message + "\n");
		} else {
			process.stderr.write(message + "\n");
		}
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
		this.#updateProgressBarTotal();
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
		this.#updateProgressBarTotal();
	}

	#getProjectMetadata(projectName) {
		const projectMetadata = this.#projectMetadata.get(projectName);
		if (!projectMetadata) {
			throw new Error(`ConsoleHandler: Unexpected project ${projectName}`);
		}
		return projectMetadata;
	}

	#updateProgressBarTotal() {
		let numberOfTasks = 0;
		this.#projectMetadata.forEach(({projectTasks}) => {
			numberOfTasks += projectTasks.size;
		});

		// Project progress should weigh more than single task progress
		// This is proportional to the number of projects (since that also multiplies the number of tasks)
		this.#progressBarProjectWeight = this.#projectMetadata.size;
		this.#getProgressBar().setTotal(
			(this.#progressBarProjectWeight * this.#projectMetadata.size) + numberOfTasks);
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
		const buildIndex = `Project ${projectMetadata.buildStartIndex} of ${this.#projectMetadata.size}`;

		let message;
		switch (status) {
		case "project-build-start":
			projectMetadata.buildStarted = true;
			message = `${chalk.blue(figures.pointer)} ` +
				`Building ${projectType} project ${chalk.bold(projectName)}...`;

			// Update progress bar message with current project
			this.#getProgressBar().update({
				message: `${figures.pointer} Building ${projectType} project ${projectName}...`
			});
			break;
		case "project-build-finish":
			projectMetadata.buildFinished = true;
			message = `${chalk.green(figures.tick)} ` +
				`Finished building ${projectType} project ${chalk.bold(projectName)}`;

			// Update progress. Projects weight 10x
			this.#getProgressBar().increment(this.#progressBarProjectWeight);
			break;
		case "project-build-skip":
			projectMetadata.buildSkipped = true;
			message = `${chalk.yellow(figures.tick)} ` +
				`Skipping build of ${projectType} project ${chalk.bold(projectName)}`;

			// Update progress. Projects weight 10x
			this.#getProgressBar().increment(this.#progressBarProjectWeight);
			break;
		default:
			break;
		}
		if (message && StandardLogger.isLevelEnabled(level)) {
			this.#logMessage(`${levelPrefix} ${chalk.grey(buildIndex)}: ${message}`);
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
		let taskIndex = "";
		if (StandardLogger.isLevelEnabled("verbose")) {
			taskIndex = chalk.grey(`Task ${taskMetadata.executionStartIndex} of ${projectTasks.size} `);
		}

		let message;
		switch (status) {
		case "task-start":
			message = `${chalk.blue(figures.pointerSmall)} Running task ${chalk.bold(taskName)}...`;
			break;
		case "task-finish":
			message = `${chalk.green(figures.tick)} Finished task ${chalk.bold(taskName)}`;

			// Update progress
			this.#getProgressBar().increment(1);
			break;
		default:
			break;
		}
		if (message && StandardLogger.isLevelEnabled(level)) {
			this.#logMessage(
				`${levelPrefix} ${chalk.blue(`${chalk.bold(projectName)}`)} ${taskIndex}${message}`);
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
