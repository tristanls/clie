/*
 * index.js: clie
 *
 * (C) 2013 Tristan Slominski
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
    var emitter = new events.EventEmitter();
    var wrapper = function (args) {
        if (args.params && args.params.usage && wrapper.usage) {
            wrapper.data(wrapper.usage);
            wrapper.end();
            return wrapper;
        }
        func(args);
        return wrapper;
    };

    wrapper.data = function () {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift('data');
        process.nextTick(function () {
            emitter.emit.apply(emitter, args);
        });
        return wrapper;
    };

    wrapper.emit = function () {
        return emitter.emit.apply(emitter, arguments);
    };

    wrapper.end = function () {
        process.nextTick(function () {
            emitter.emit('end');
        });
        return wrapper;
    };

    wrapper.error = function (error) {
        process.nextTick(function () {
            emitter.emit('error', error);
        });
        return wrapper;
    };

    wrapper.on = function () {
        return emitter.on.apply(emitter, arguments);
    };

    return wrapper;
};
