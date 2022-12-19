import StandardLogger from "./loggers/StandardLogger.js";
export default {
	getLogger: (moduleName) => {
		return new StandardLogger(moduleName);
	},
	isLevelEnabled: StandardLogger.isLevelEnabled,
	setLevel: StandardLogger.setLevel
};
