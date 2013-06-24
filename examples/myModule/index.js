/*
 * index.js: my-module
 *
 * (C) 2013 Tristan Slominski
 */
"use strict";

var clie = require('clie'),
    path = require('path');

var commandsDirectory = path.normalize(path.join(__dirname, 'commands'));

module.exports = clie({commandsDirectory: commandsDirectory});