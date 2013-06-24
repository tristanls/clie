/*
 * two.js
 *
 * (C) 2013 Tristan Slominski
 */
"use strict";

var clie = require('clie');

var two = module.exports = clie.command(function (args) {
	var myModule = require('../index.js');

	if (args.params.usage) return two.data(two.usage).end();

	if (args.params.one) {
		var oneEmitter = myModule.commands.one(args);
		oneEmitter.on('data', two.data);
		oneEmitter.on('error', two.error);
		oneEmitter.on('end', two.end);
	} else {
		two.data('two').end();
	}
});

two.usage = [
  "\nUsage: my-module two [options]",
  "           options: --one (Display 'one' instead of 'two')"
].join('\n');