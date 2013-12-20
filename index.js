/*

index.js - clie

The MIT License (MIT)

Copyright (c) 2013 Tristan Slominski

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.

*/ 
"use strict";

var abbrev = require('abbrev'),
    events = require('events'),
    fs = require('fs'),
    nopt = require('nopt'),
    path = require('path'),
    util = require('util');

module.exports = clie;

function clie (configuration) {
    configuration = configuration || {};

    var cli = {
        aliases: {},
        commandCache: {},
        commandList: [],
        knownOpts: {
            'h': Boolean  // builtin help flag
        }
    };

    if (!configuration.commandsDirectory) {
        throw new Error("commandsDirectory is not set");
    }
    var commands = fs.readdirSync(configuration.commandsDirectory);

    commands.forEach(function (file) {
        file = path.join(configuration.commandsDirectory, file);
        var command = require(file);

        if (!command) return; // nothing to do if can't require

        var commandName = path.basename(file, '.js');
        cli.commandList.push(commandName);

        if (command.aliases && util.isArray(command.aliases)) {
            command.aliases.forEach(function (alias) {
                cli.aliases[alias] = commandName;
            });
        }

        if (command.knownOpts) {
            Object.keys(command.knownOpts).forEach(function (option) {
                if (!command.knownOpts[option]) return;

                cli.knownOpts[option] = cli.knownOpts[option] || [];
                if (util.isArray(command.knownOpts[option])) {
                    command.knownOpts[option].forEach(function (optionType) {
                        cli.knownOpts[option].push(optionType);
                    });
                } else {
                    cli.knownOpts[option].push(command.knownOpts[option]);
                }
            });
        }

        if (cli.commandCache[commandName]) return;

        cli.commandCache[commandName] = function () {
            return command.apply(cli, Array.prototype.slice.call(arguments, 0));
        };

        Object.keys(command).forEach(function (param) {
            cli.commandCache[commandName][param] = command[param];
        });
    });

    cli.aliasNames = Object.keys(cli.aliases);
    cli.fullList = cli.commandList.concat(cli.aliasNames);
    cli.abbrevs = abbrev(cli.fullList);

    cli.commands = {};

    cli.deref = function deref (c) {
        if (!c) return "";
        var a = cli.abbrevs[c];
        if (cli.aliases[a]) a = cli.aliases[a];
        return a;
    };

    Object.keys(cli.abbrevs).forEach(function addCommand (c) {
        Object.defineProperty(cli.commands, c, { get: function () {
            var a = cli.deref(c);
            cli.command = c;
            return cli.commandCache[a];
        }, enumerable: true});
    });

    cli.cli = function () {
        var conf = nopt(cli.knownOpts, {});
        cli.argv = conf.argv.remain;
        if (cli.deref(cli.argv[0])) {
            cli.command = cli.argv.shift();
        } else {
            conf.usage = true;
        }

        if (conf.usage && cli.command != "help") {
            cli.argv.unshift(cli.command);
            cli.command = "help";
        }

        cli.argv.params = conf;
        if (cli.argv.params.h) cli.argv.params.usage = true;
        return cli.commands[cli.command](cli.argv);
    };

    return cli;
};

clie.command = function command (func) {
    var wrapper = function (args) {
        var emitter = new events.EventEmitter();
        var invocation = {};

        invocation.data = function () {
            var args = Array.prototype.slice.call(arguments, 0);
            args.unshift('data');
            process.nextTick(function () {
                emitter.emit.apply(emitter, args);
            });
            return invocation;
        };

        invocation.emit = function () {
            return emitter.emit.apply(emitter, arguments);
        };

        invocation.end = function () {
            process.nextTick(function () {
                emitter.emit('end');
            });
            return invocation;
        };        

        invocation.error = function (error) {
            process.nextTick(function () {
                emitter.emit('error', error);
            });
            return invocation;
        };

        invocation.on = function () {
            return emitter.on.apply(emitter, arguments);
        };        

        if (args && args.params && args.params.usage && wrapper.usage) {
            invocation.data(wrapper.usage);
            invocation.end();
            return invocation;
        }
        func.call(invocation, args);
        return invocation;
    };
    return wrapper;
};
