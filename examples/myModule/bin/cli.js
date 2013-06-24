#!/usr/bin/env node
"use strict";

var commandEmitter = require('../index.js').cli();

commandEmitter.on('data', function (data) {
	console.log(data);
});

commandEmitter.on('error', function (error) {
	console.error(error);
});