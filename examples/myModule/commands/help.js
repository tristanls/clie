/*
 * help.js
 *
 * (C) 2013 Tristan Slominski
 */
"use strict";

var clie = require('clie');

var help = module.exports = clie.command(function (args) {
	var self = this;
    self.data(help.usage).end();
});

help.usage = [
  "\nUsage: my-module <command>",
  "",
  "where <command> is one of:",
  "  one, two"
].join('\n');