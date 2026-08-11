/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @polyfill
 * @nolint
 * @format
 */

/* eslint-disable no-shadow, eqeqeq, curly, no-unused-vars, no-void,
 * no-control-regex  */

#pragma once

constexpr std::string_view preludeJsCode = R"___(
(function (global, __DEV__) {const inspect = (function () {
  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  //
  // https://github.com/joyent/node/blob/master/lib/util.js

  function inspect(obj, opts) {
    var ctx = {
      seen: [],
      formatValueCalls: 0,
      stylize: stylizeNoColor,
    };
    return formatValue(ctx, obj, opts.depth);
  }

  function stylizeNoColor(str, styleType) {
    return str;
  }

  function arrayToHash(array) {
    var hash = {};

    array.forEach(function (val, idx) {
      hash[val] = true;
    });

    return hash;
  }

  function formatValue(ctx, value, recurseTimes) {
    ctx.formatValueCalls++;
    if (ctx.formatValueCalls > 200) {
      return `[TOO BIG formatValueCalls ${ctx.formatValueCalls} exceeded limit of 200]`;
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }

    // Look up the keys of the object.
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (
      isError(value) &&
      (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)
    ) {
      return formatError(value);
    }

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (isFunction(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '',
      array = false,
      braces = ['{', '}'];

    // Make Array say that they are Array
    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    }

    // Make functions say that they are functions
    if (isFunction(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);

    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function (key) {
        return formatProperty(
          ctx,
          value,
          recurseTimes,
          visibleKeys,
          key,
          array,
        );
      });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
  }

  function formatPrimitive(ctx, value) {
    if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
    if (isString(value)) {
      var simple =
        "'" +
        JSON.stringify(value)
          .replace(/^"|"$/g, '')
          .replace(/'/g, "\\'")
          .replace(/\\"/g, '"') +
        "'";
      return ctx.stylize(simple, 'string');
    }
    if (isNumber(value)) return ctx.stylize('' + value, 'number');
    if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
    // For some reason typeof null is "object", so special case here.
    if (isNull(value)) return ctx.stylize('null', 'null');
  }

  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }

  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(
          formatProperty(
            ctx,
            value,
            recurseTimes,
            visibleKeys,
            String(i),
            true,
          ),
        );
      } else {
        output.push('');
      }
    }
    keys.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
        output.push(
          formatProperty(ctx, value, recurseTimes, visibleKeys, key, true),
        );
      }
    });
    return output;
  }

  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || {value: value[key]};
    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }
    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }
        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str
              .split('\n')
              .map(function (line) {
                return '  ' + line;
              })
              .join('\n')
              .slice(2);
          } else {
            str =
              '\n' +
              str
                .split('\n')
                .map(function (line) {
                  return '   ' + line;
                })
                .join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }
    if (isUndefined(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.slice(1, name.length - 1);
        name = ctx.stylize(name, 'name');
      } else {
        name = name
          .replace(/'/g, "\\'")
          .replace(/\\"/g, '"')
          .replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }

  function reduceToSingleString(output, base, braces) {
    var numLinesEst = 0;
    var length = output.reduce(function (prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);

    if (length > 60) {
      return (
        braces[0] +
        (base === '' ? '' : base + '\n ') +
        ' ' +
        output.join(',\n  ') +
        ' ' +
        braces[1]
      );
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }

  // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.
  function isArray(ar) {
    return Array.isArray(ar);
  }

  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }

  function isNull(arg) {
    return arg === null;
  }

  function isNullOrUndefined(arg) {
    return arg == null;
  }

  function isNumber(arg) {
    return typeof arg === 'number';
  }

  function isString(arg) {
    return typeof arg === 'string';
  }

  function isSymbol(arg) {
    return typeof arg === 'symbol';
  }

  function isUndefined(arg) {
    return arg === void 0;
  }

  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }

  function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
  }

  function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
  }

  function isError(e) {
    return (
      isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error)
    );
  }

  function isFunction(arg) {
    return typeof arg === 'function';
  }

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }

  return inspect;
})();

const OBJECT_COLUMN_NAME = '(index)';
const LOG_LEVELS = {
  trace: 0,
  info: 1,
  warn: 2,
  error: 3,
};
const INSPECTOR_LEVELS = [];
INSPECTOR_LEVELS[LOG_LEVELS.trace] = 'debug';
INSPECTOR_LEVELS[LOG_LEVELS.info] = 'log';
INSPECTOR_LEVELS[LOG_LEVELS.warn] = 'warning';
INSPECTOR_LEVELS[LOG_LEVELS.error] = 'error';

// Strip the inner function in getNativeLogFunction(), if in dev also
// strip method printing to originalConsole.
const INSPECTOR_FRAMES_TO_SKIP = __DEV__ ? 2 : 1;

function getNativeLogFunction(level) {
  return function () {
    let str;
    if (arguments.length === 1 && typeof arguments[0] === 'string') {
      str = arguments[0];
    } else {
      str = Array.prototype.map
        .call(arguments, function (arg) {
          return inspect(arg, {depth: 10});
        })
        .join(', ');
    }

    // TRICKY
    // If more than one argument is provided, the code above collapses them all
    // into a single formatted string. This transform wraps string arguments in
    // single quotes (e.g. "foo" -> "'foo'") which then breaks the "Warning:"
    // check below. So it's important that we look at the first argument, rather
    // than the formatted argument string.
    const firstArg = arguments[0];

    let logLevel = level;
    if (
      typeof firstArg === 'string' &&
      firstArg.slice(0, 9) === 'Warning: ' &&
      logLevel >= LOG_LEVELS.error
    ) {
      // React warnings use console.error so that a stack trace is shown,
      // but we don't (currently) want these to show a redbox
      // (Note: Logic duplicated in ExceptionsManager.js.)
      logLevel = LOG_LEVELS.warn;
    }
    if (global.__inspectorLog) {
      global.__inspectorLog(
        INSPECTOR_LEVELS[logLevel],
        str,
        [].slice.call(arguments),
        INSPECTOR_FRAMES_TO_SKIP,
      );
    }
    if (groupStack.length) {
      str = groupFormat('', str);
    }
    global.nativeLoggingHook(str, logLevel);
  };
}

function repeat(element, n) {
  return Array.apply(null, Array(n)).map(function () {
    return element;
  });
}

function consoleTablePolyfill(rows) {
  // convert object -> array
  if (!Array.isArray(rows)) {
    var data = rows;
    rows = [];
    for (var key in data) {
      if (data.hasOwnProperty(key)) {
        var row = data[key];
        row[OBJECT_COLUMN_NAME] = key;
        rows.push(row);
      }
    }
  }
  if (rows.length === 0) {
    global.nativeLoggingHook('', LOG_LEVELS.info);
    return;
  }

  var columns = Object.keys(rows[0]).sort();
  var stringRows = [];
  var columnWidths = [];

  // Convert each cell to a string. Also
  // figure out max cell width for each column
  columns.forEach(function (k, i) {
    columnWidths[i] = k.length;
    for (var j = 0; j < rows.length; j++) {
      var cellStr = (rows[j][k] || '?').toString();
      stringRows[j] = stringRows[j] || [];
      stringRows[j][i] = cellStr;
      columnWidths[i] = Math.max(columnWidths[i], cellStr.length);
    }
  });

  // Join all elements in the row into a single string with | separators
  // (appends extra spaces to each cell to make separators  | aligned)
  function joinRow(row, space) {
    var cells = row.map(function (cell, i) {
      var extraSpaces = repeat(' ', columnWidths[i] - cell.length).join('');
      return cell + extraSpaces;
    });
    space = space || ' ';
    return cells.join(space + '|' + space);
  }

  var separators = columnWidths.map(function (columnWidth) {
    return repeat('-', columnWidth).join('');
  });
  var separatorRow = joinRow(separators, '-');
  var header = joinRow(columns);
  var table = [header, separatorRow];

  for (var i = 0; i < rows.length; i++) {
    table.push(joinRow(stringRows[i]));
  }

  // Notice extra empty line at the beginning.
  // Native logging hook adds "RCTLog >" at the front of every
  // logged string, which would shift the header and screw up
  // the table
  global.nativeLoggingHook('\n' + table.join('\n'), LOG_LEVELS.info);
}

const GROUP_PAD = '\u2502'; // Box light vertical
const GROUP_OPEN = '\u2510'; // Box light down+left
const GROUP_CLOSE = '\u2518'; // Box light up+left

const groupStack = [];

function groupFormat(prefix, msg) {
  // Insert group formatting before the console message
  return groupStack.join('') + prefix + ' ' + (msg || '');
}

function consoleGroupPolyfill(label) {
  global.nativeLoggingHook(groupFormat(GROUP_OPEN, label), LOG_LEVELS.info);
  groupStack.push(GROUP_PAD);
}

function consoleGroupCollapsedPolyfill(label) {
  global.nativeLoggingHook(groupFormat(GROUP_CLOSE, label), LOG_LEVELS.info);
  groupStack.push(GROUP_PAD);
}

function consoleGroupEndPolyfill() {
  groupStack.pop();
  global.nativeLoggingHook(groupFormat(GROUP_CLOSE), LOG_LEVELS.info);
}

function consoleAssertPolyfill(expression, label) {
  if (!expression) {
    global.nativeLoggingHook('Assertion failed: ' + label, LOG_LEVELS.error);
  }
}

if (global.nativeLoggingHook) {
  const originalConsole = global.console;
  // Preserve the original `console` as `originalConsole`
  if (__DEV__ && originalConsole) {
    const descriptor = Object.getOwnPropertyDescriptor(global, 'console');
    if (descriptor) {
      Object.defineProperty(global, 'originalConsole', descriptor);
    }
  }

  global.console = {
    ...(originalConsole ?? {}),
    error: getNativeLogFunction(LOG_LEVELS.error),
    info: getNativeLogFunction(LOG_LEVELS.info),
    log: getNativeLogFunction(LOG_LEVELS.info),
    warn: getNativeLogFunction(LOG_LEVELS.warn),
    trace: getNativeLogFunction(LOG_LEVELS.trace),
    debug: getNativeLogFunction(LOG_LEVELS.trace),
    table: consoleTablePolyfill,
    group: consoleGroupPolyfill,
    groupEnd: consoleGroupEndPolyfill,
    groupCollapsed: consoleGroupCollapsedPolyfill,
    assert: consoleAssertPolyfill,
  };

  Object.defineProperty(console, '_isPolyfilled', {
    value: true,
    enumerable: false,
  });

  // If available, also call the original `console` method since that is
  // sometimes useful. Ex: on OS X, this will let you see rich output in
  // the Safari Web Inspector console.
  if (__DEV__ && originalConsole) {
    Object.keys(console).forEach(methodName => {
      const reactNativeMethod = console[methodName];
      if (
        originalConsole[methodName] &&
        reactNativeMethod !== originalConsole[methodName]
      ) {
        console[methodName] = function () {
          originalConsole[methodName](...arguments);
          reactNativeMethod.apply(console, arguments);
        };
      }
    });

    // The following methods are not supported by this polyfill but
    // we still should pass them to original console if they are
    // supported by it.
    ['clear', 'dir', 'dirxml', 'profile', 'profileEnd'].forEach(methodName => {
      if (typeof originalConsole[methodName] === 'function') {
        console[methodName] = function () {
          originalConsole[methodName](...arguments);
        };
      }
    });
  }
} else if (!global.console) {
  function stub() {}
  const log = global.print || stub;

  global.console = {
    debug: log,
    error: log,
    info: log,
    log: log,
    trace: log,
    warn: log,
    assert(expression, label) {
      if (!expression) {
        log('Assertion failed: ' + label);
      }
    },
    clear: stub,
    dir: stub,
    dirxml: stub,
    group: stub,
    groupCollapsed: stub,
    groupEnd: stub,
    profile: stub,
    profileEnd: stub,
    table: stub,
  };

  Object.defineProperty(console, '_isPolyfilled', {
    value: true,
    enumerable: false,
  });
}})(globalThis, true)
//# sourceURL=prelude.js
)___";
