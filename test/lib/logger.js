const test = require("ava");
const mock = require("mock-require");
const sinon = require("sinon");

test.beforeEach((t) => {
	t.context.npmLogStub = {
		enableProgress: sinon.stub(),
		disableProgress: sinon.stub(),
		enableUnicode: sinon.stub(),
		on: sinon.stub(),
		newGroup: sinon.stub(),
	};
	mock("npmlog", t.context.npmLogStub);

	t.context.logger = mock.reRequire("../../lib/logger");
});

test.afterEach.always((t) => {
	mock.stopAll();
	sinon.restore();
});

test.serial("getLogger", (t) => {
	const {logger} = t.context;
	const {Logger} = logger.__test__;

	const myLogger = logger.getLogger("my-module");
	t.true(myLogger instanceof Logger, "Returned logger should be Logger instance");
});

test.serial("getGroupLogger", (t) => {
	const {logger} = t.context;
	const {GroupLogger} = logger.__test__;

	const myLogger = logger.getGroupLogger("my-module");
	t.true(myLogger instanceof GroupLogger, "Returned logger should be Logger instance");
});

test.serial("setLevel", (t) => {
	const {logger} = t.context;

	logger.setLevel("silly");
	t.is(t.context.npmLogStub.level, "silly", "npmlog.level should be set to 'silly'");

	t.throws(() => logger.setLevel("fancy"), {message: `Unkown log level "fancy"`});
	t.is(t.context.npmLogStub.level, "silly", "npmlog.level should still be set to 'silly'");
});

test.serial("isLevelEnabled", (t) => {
	const {logger} = t.context;

	// On silly all levels should be enabled
	logger.setLevel("silly");
	t.true(logger.isLevelEnabled("silly"));
	t.true(logger.isLevelEnabled("verbose"));
	t.true(logger.isLevelEnabled("info"));
	t.true(logger.isLevelEnabled("warn"));
	t.true(logger.isLevelEnabled("error"));
	t.true(logger.isLevelEnabled("silent"));

	// On silent only silent should be enabled
	logger.setLevel("silent");
	t.false(logger.isLevelEnabled("silly"));
	t.false(logger.isLevelEnabled("verbose"));
	t.false(logger.isLevelEnabled("info"));
	t.false(logger.isLevelEnabled("warn"));
	t.false(logger.isLevelEnabled("error"));
	t.true(logger.isLevelEnabled("silent"));

	// On info only info,warn,error,silent should be enabled
	logger.setLevel("info");
	t.false(logger.isLevelEnabled("silly"));
	t.false(logger.isLevelEnabled("verbose"));
	t.true(logger.isLevelEnabled("info"));
	t.true(logger.isLevelEnabled("warn"));
	t.true(logger.isLevelEnabled("error"));
	t.true(logger.isLevelEnabled("silent"));
});

test.serial("setShowProgress", (t) => {
	const {logger, npmLogStub} = t.context;

	t.is(npmLogStub.enableProgress.callCount, 0, "enableProgress should not be called initially");
	t.is(npmLogStub.disableProgress.callCount, 0, "disableProgress should not be called initially");

	logger.setShowProgress(true);

	t.is(npmLogStub.enableProgress.callCount, 1, "enableProgress should be called once");
	t.is(npmLogStub.disableProgress.callCount, 0, "disableProgress should still not be called");

	logger.setShowProgress(false);

	t.is(npmLogStub.enableProgress.callCount, 1, "enableProgress should still be called once");
	t.is(npmLogStub.disableProgress.callCount, 1, "disableProgress should be called once");
});

test.serial("npmlog.level default", (t) => {
	t.is(t.context.npmLogStub.level, "info", "Default level should be info");
});
