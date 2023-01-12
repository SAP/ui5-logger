import Logger from "./loggers/Logger.js";
export default {
	getLogger: (moduleName) => {
		return new Logger(moduleName);
	},
	isLevelEnabled: Logger.isLevelEnabled,
	setLevel: Logger.setLevel
};
