/*
 * one.js
 *
 * (C) 2013 Tristan Slominski
 */
"use strict";

var clie = require('clie');

var one = module.exports = clie.command(function (args) {
	one.data('one').end();
});

one.usage = [
  "\nUsage: my-module one",
  "",
  "Displays 'one'"
].join('\n');