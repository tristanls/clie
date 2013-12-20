/*
 * two.js
 *
 * (C) 2013 Tristan Slominski
 */
"use strict";

var clie = require('clie');

var two = module.exports = clie.command(function (args) {
    var self = this;
	var myModule = require('../index.js');

	if (args.params.usage) return self.data(two.usage).end();

	if (args.params.one) {
		var oneEmitter = myModule.commands.one(args);
		oneEmitter.on('data', self.data);
		oneEmitter.on('error', self.error);
		oneEmitter.on('end', self.end);
	} else {
		self.data('two').end();
	}
});

two.usage = [
  "\nUsage: my-module two [options]",
  "           options: --one (Display 'one' instead of 'two')"
].join('\n');