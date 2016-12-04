/*global jasmine, require, process*/
var Jasmine = require('jasmine'),
	SpecReporter = require('jasmine-spec-reporter'),
	jrunner = new Jasmine(),
	filter;

jasmine.getEnv().clearReporters();
jasmine.getEnv().addReporter(new SpecReporter({
	displayStacktrace: 'all'
}));

process.argv.slice(2).forEach(function (option) {
	'use strict';
	if (option.match('^filter=')) {
		filter = option.match('^filter=(.*)')[1];
	}
});
jrunner.loadConfigFile();                           // load jasmine.json configuration
jrunner.execute(undefined, filter);
