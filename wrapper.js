/*

wrapper.js - clie wrapper

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

var events = require('events');

var Wrapper = module.exports = function Wrapper() {
    var self = this;

    self.emitter = new events.EventEmitter();
};

Wrapper.prototype.data = function data() {
    var self = this;
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('data');
    process.nextTick(function () {
        self.emitter.emit.apply(self.emitter, args);
    });
    return self;
};

Wrapper.prototype.create = function create(func) {
    var self = this;
    var wrapper = function (args) {
        if (args && args.params && args.params.usage && self.usage) {
            self.data(self.usage);
            self.end();
            return wrapper;
        }
        func(args);
        return wrapper(args);
    }

    wrapper.on = function () {
        console.dir(arguments);
        return self.emitter.on.apply(self.emitter, arguments);
    };

    return wrapper;
};

Wrapper.prototype.emit = function emit() {
    var self = this;
    return self.emitter.emit.apply(self.emitter, arguments);
};

Wrapper.prototype.end = function end() {
    var self = this;
    process.nextTick(function () {
        self.emitter.emit('end');
    });
    return self;
};

Wrapper.prototype.error = function error(error) {
    var self = this;
    process.nextTick(function () {
        self.emitter.emit('error', error);
    });
    return self;
};