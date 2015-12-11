# clie

_Stability: 1 - [Experimental](https://github.com/tristanls/stability-index#stability-1---experimental)_

Evented command-line.

## Usage

### Programmatically

#### Enable

```javascript
// your module main.js
"use strict";

var clie = require('clie'),
    path = require('path');

var commandsDirectory = path.normalize(path.join(__dirname, 'commands'));

module.exports = clie({commandsDirectory: commandsDirectory});
```

#### Use

```javascript
// module that uses your module
var myModule = require('my-module');
myModule.commands // has all the commands
```

### Command-Line

#### Use

Call `cli()` on required module.

```javascript
// your module cli.js
#!/usr/bin/env node
"use strict";

var commandEmitter = require('../index.js').cli();

commandEmitter.on('data', function (data) {
	console.log(data);
});

commandEmitter.on('error', function (error) {
	console.error(error);
});
```

### Create a command

```javascript
// commands/one.js
"use strict";

var clie = require('clie');

var one = module.exports = clie.command(function (args) {
	var self = this;
    self.data('one').end();
});

one.usage = [
  "\nUsage: my-module one",
  "",
  "Displays 'one'"
].join('\n');
```

### Reuse commands within commands

To `require` the module the command belongs to, it must be called within the command body as depicted below (`var myModule = require('../index.js')`).

```javascript
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
```

## Releases

We follow semantic versioning policy ([semver.org](http://semver.org/)) with a caveat:

> Given a version number MAJOR.MINOR.PATCH, increment the:
>
>MAJOR version when you make incompatible API changes,<br/>
>MINOR version when you add functionality in a backwards-compatible manner, and<br/>
>PATCH version when you make backwards-compatible bug fixes.

**caveat**: Major version zero is a special case indicating development version that may make incompatible API changes without incrementing MAJOR version.
