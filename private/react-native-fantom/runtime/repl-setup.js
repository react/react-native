/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * Runtime helpers for the Fantom REPL (`fantom-cli`). This module runs inside
 * the Hermes runtime hosted by the native tester binary. It:
 *
 *  - exposes commonly used modules (`React`, `ReactNative`, `Fantom`) as globals
 *    so they can be used at the prompt without an explicit import,
 *  - maintains a persistent scope shared across evaluations
 *    (`global.$$REPL_SCOPE$$`),
 *  - captures uncaught errors (Metro routes module-factory errors to
 *    `ErrorUtils` rather than re-throwing),
 *  - is configured by the host once on startup via `global.$$ReplConfigure$$`
 *    (runtime constants and whether to colorize output), and
 *  - defines `global.$$ReplReport$$`, which the host appends to each evaluation
 *    to report the result (or error) of the last statement back over stdout.
 */

import type {FantomRuntimeConstants} from '@react-native/fantom/src/Constants';

import * as Fantom from '@react-native/fantom';
import {setConstants} from '@react-native/fantom/src/Constants';
import * as React from 'react';
import * as ReactNative from 'react-native';

// Persistent scope shared across REPL evaluations. Top-level bindings declared
// at the prompt are bridged in and out of this object by the host so that they
// survive across evaluations (see repl/replTransform.js).
global.$$REPL_SCOPE$$ = global.$$REPL_SCOPE$$ ?? {};

// The value of the last evaluated expression (if any) and whether there was one.
global.$$REPL_RESULT$$ = undefined;
global.$$REPL_HAS_RESULT$$ = false;

// Whether to colorize output with ANSI escape codes. Set by the host based on
// whether its stdout is a TTY.
global.$$REPL_COLORS$$ = false;

// Convenience globals available at the prompt without importing.
global.React = React;
global.ReactNative = ReactNative;
global.Fantom = Fantom;

// Configured by the host once, on startup, with values it computes in Node
// (e.g. `isOSS`, the host platform). This is how the runtime constants are set
// dynamically at startup rather than hardcoded.
global.$$ReplConfigure$$ = (config: {
  colors: boolean,
  constants: FantomRuntimeConstants,
}): void => {
  global.$$REPL_COLORS$$ = config.colors;
  setConstants(config.constants);
};

// Metro's `__r` runs each entry module inside `ErrorUtils` when it is installed,
// which reports factory errors via the global handler instead of re-throwing.
// Capture those so `$$ReplReport$$` can surface them to the host.
let pendingError: unknown = null;
const errorUtils = global.ErrorUtils;
if (errorUtils != null) {
  errorUtils.setGlobalHandler((error: unknown) => {
    pendingError = error;
  });
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message != null ? error.message : '';
    return `${error.name}: ${message.split('\n')[0]}`;
  }
  return String(error);
}

// Inspector that produces output similar to the Chrome DevTools / Node.js
// console: nested objects and arrays are expanded (up to a depth limit),
// strings are quoted, functions/classes/Map/Set get readable tags, circular
// references are detected, and long collections wrap onto multiple lines.

const INSPECT_DEPTH = 2;
const INLINE_BREAK_LENGTH = 72;
const MAX_ENTRIES = 100;

// ANSI colors roughly matching the Node.js / Chrome DevTools console.
const COLORS = {
  string: '32',
  number: '33',
  boolean: '33',
  nullish: '90',
  symbol: '32',
  fn: '36',
  special: '36',
  date: '35',
  regexp: '31',
  error: '31',
};

function color(code: string, text: string): string {
  return global.$$REPL_COLORS$$ === true ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function quoteString(value: string): string {
  return (
    "'" +
    value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n') +
    "'"
  );
}

function formatKey(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : quoteString(key);
}

// Reads an own property value. Uses property descriptors (rather than `[]`
// indexing, which Flow can't type on an opaque object, or `Reflect`, which
// isn't available in Hermes) so a single getter is invoked at a time, keeping
// the per-property error isolation below working.
function readProperty(target: interface {}, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (descriptor == null) {
    return undefined;
  }
  const getter = descriptor.get;
  if (getter != null) {
    return getter.call(target);
  }
  return descriptor.value;
}

function getConstructorName(value: interface {}): ?string {
  const proto = Object.getPrototypeOf(value);
  if (proto == null) {
    return null;
  }
  const ctor = proto.constructor;
  return ctor != null && typeof ctor.name === 'string' && ctor.name !== ''
    ? ctor.name
    : null;
}

function isClassFunction(value: unknown): boolean {
  try {
    return /^class[\s{]/.test(String(value));
  } catch {
    return false;
  }
}

// Renders a list of already-formatted entries inline if they are short, or one
// per line (indented) otherwise.
function wrapEntries(
  open: string,
  close: string,
  prefix: string,
  entries: Array<string>,
  indent: string,
): string {
  if (entries.length === 0) {
    return prefix + open + close;
  }
  const oneLine = prefix + open + ' ' + entries.join(', ') + ' ' + close;
  if (oneLine.length <= INLINE_BREAK_LENGTH && !oneLine.includes('\n')) {
    return oneLine;
  }
  const inner = indent + '  ';
  return (
    prefix +
    open +
    '\n' +
    entries.map(entry => inner + entry).join(',\n') +
    '\n' +
    indent +
    close
  );
}

function inspectObject(
  value: interface {},
  depth: number,
  seen: Set<unknown>,
  indent: string,
): string {
  if (value instanceof Error) {
    return color(
      COLORS.error,
      value.stack != null && value.stack !== ''
        ? value.stack
        : `${value.name}: ${value.message}`,
    );
  }
  if (value instanceof RegExp) {
    return color(COLORS.regexp, value.toString());
  }
  if (value instanceof Date) {
    return color(
      COLORS.date,
      Number.isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString(),
    );
  }
  if (seen.has(value)) {
    return color(COLORS.special, '[Circular]');
  }
  if (depth < 0) {
    if (Array.isArray(value)) {
      return color(COLORS.special, '[Array]');
    }
    const name = getConstructorName(value);
    return color(
      COLORS.special,
      name != null && name !== 'Object' ? `[${name}]` : '[Object]',
    );
  }

  seen.add(value);
  const childDepth = depth - 1;
  const childIndent = indent + '  ';
  let result;

  if (Array.isArray(value)) {
    const entries = [];
    const limit = Math.min(value.length, MAX_ENTRIES);
    for (let i = 0; i < limit; i++) {
      entries.push(inspect(value[i], childDepth, seen, childIndent));
    }
    if (value.length > MAX_ENTRIES) {
      entries.push(`... ${value.length - MAX_ENTRIES} more item(s)`);
    }
    result = wrapEntries('[', ']', '', entries, indent);
  } else if (value instanceof Map) {
    const entries = [];
    let count = 0;
    for (const [k, v] of value) {
      if (count++ >= MAX_ENTRIES) {
        entries.push(`... ${value.size - MAX_ENTRIES} more item(s)`);
        break;
      }
      entries.push(
        inspect(k, childDepth, seen, childIndent) +
          ' => ' +
          inspect(v, childDepth, seen, childIndent),
      );
    }
    result = wrapEntries('{', '}', `Map(${value.size}) `, entries, indent);
  } else if (value instanceof Set) {
    const entries = [];
    let count = 0;
    for (const v of value) {
      if (count++ >= MAX_ENTRIES) {
        entries.push(`... ${value.size - MAX_ENTRIES} more item(s)`);
        break;
      }
      entries.push(inspect(v, childDepth, seen, childIndent));
    }
    result = wrapEntries('{', '}', `Set(${value.size}) `, entries, indent);
  } else {
    const name = getConstructorName(value);
    const prefix = name != null && name !== 'Object' ? name + ' ' : '';
    const keys = Object.keys(value);
    const entries = [];
    const limit = Math.min(keys.length, MAX_ENTRIES);
    for (let i = 0; i < limit; i++) {
      const key = keys[i];
      // Inspecting a property must never leak an error into the next
      // evaluation. Some getters (e.g. TurboModule-backed APIs that aren't
      // registered in the Fantom binary) don't throw synchronously: Metro
      // routes the error through `ErrorUtils` (into `pendingError`) and the
      // getter returns `undefined`. Detect both cases, surface the error in
      // the property's slot, and always restore the captured-error state.
      const errorBefore = pendingError;
      let rendered;
      try {
        const propertyValue = readProperty(value, key);
        if (pendingError !== errorBefore) {
          rendered = color(
            COLORS.error,
            `[Thrown: ${describeError(pendingError)}]`,
          );
        } else {
          rendered = inspect(propertyValue, childDepth, seen, childIndent);
        }
      } catch (error) {
        rendered = color(COLORS.error, `[Thrown: ${describeError(error)}]`);
      }
      pendingError = errorBefore;
      entries.push(formatKey(key) + ': ' + rendered);
    }
    if (keys.length > MAX_ENTRIES) {
      entries.push(`... ${keys.length - MAX_ENTRIES} more item(s)`);
    }
    result = wrapEntries('{', '}', prefix, entries, indent);
  }

  seen.delete(value);
  return result;
}

function inspect(
  value: unknown,
  depth: number,
  seen: Set<unknown>,
  indent: string,
): string {
  switch (typeof value) {
    case 'string':
      return color(COLORS.string, quoteString(value));
    case 'number':
      return color(COLORS.number, Object.is(value, -0) ? '-0' : String(value));
    case 'boolean':
      return color(COLORS.boolean, String(value));
    case 'bigint':
      return color(COLORS.number, String(value) + 'n');
    case 'undefined':
      return color(COLORS.nullish, 'undefined');
    case 'symbol':
      return color(COLORS.symbol, value.toString());
    case 'function': {
      const name = typeof value.name === 'string' ? value.name : '';
      if (isClassFunction(value)) {
        return color(
          COLORS.fn,
          name !== '' ? `[class ${name}]` : '[class (anonymous)]',
        );
      }
      return color(
        COLORS.fn,
        name !== '' ? `[Function: ${name}]` : '[Function (anonymous)]',
      );
    }
    case 'object': {
      if (value === null) {
        return color(COLORS.nullish, 'null');
      }
      return inspectObject(value, depth, seen, indent);
    }
    default:
      return String(value);
  }
}

function formatValue(value: unknown): string {
  // Inspecting must never change the captured-error state used to report
  // genuine evaluation errors (getters probed here may set it as a side effect).
  const errorBefore = pendingError;
  try {
    return inspect(value, INSPECT_DEPTH, new Set<unknown>(), '');
  } catch {
    return String(value);
  } finally {
    pendingError = errorBefore;
  }
}

function reportJSON(message: interface {}): void {
  const json = JSON.stringify(message);
  if (json == null) {
    return;
  }
  // Force the import of the native module to be lazy.
  const NativeFantom =
    require('react-native/src/private/testing/fantom/specs/NativeFantom').default;
  NativeFantom.reportTestSuiteResultsJSON(json);
}

// Walks the prototype chain collecting own property names (own + inherited),
// without reading any values (so getters are never invoked).
function collectPropertyNames(target: unknown): Set<string> {
  const names = new Set<string>();
  let current: unknown = target;
  let depth = 0;
  while (current != null && typeof current === 'object' && depth < 50) {
    for (const name of Object.getOwnPropertyNames(current)) {
      names.add(name);
    }
    current = Object.getPrototypeOf(current);
    depth++;
  }
  return names;
}

// Called by the host to compute autocompletion candidates. `thunk` is either
// null (complete global identifiers + REPL scope bindings) or a function that
// returns the object whose properties should be completed.
global.$$ReplComplete$$ = (thunk: ?() => unknown): void => {
  // Completion must never affect the error state of real evaluations.
  const errorBefore = pendingError;
  const names = new Set<string>();
  try {
    if (thunk == null) {
      for (const name of collectPropertyNames(globalThis)) {
        names.add(name);
      }
      for (const key of Object.keys(global.$$REPL_SCOPE$$)) {
        names.add(key);
      }
    } else {
      const target = thunk();
      if (target != null) {
        for (const name of collectPropertyNames(Object(target))) {
          names.add(name);
        }
      }
    }
  } catch {
    // No completions available (e.g. the expression threw).
  }
  pendingError = errorBefore;

  const candidates = [];
  for (const name of names) {
    if (!name.startsWith('$$Repl') && !name.startsWith('$$REPL')) {
      candidates.push(name);
    }
  }
  reportJSON({type: 'repl-completions', names: candidates});
};

global.$$ReplReport$$ = (): void => {
  const error = pendingError;
  if (error != null) {
    pendingError = null;
    global.$$REPL_HAS_RESULT$$ = false;
    global.$$REPL_RESULT$$ = undefined;
    reportJSON({
      type: 'repl-error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && error.stack != null ? error.stack : '',
    });
    return;
  }

  if (global.$$REPL_HAS_RESULT$$ !== true) {
    return;
  }

  const text = formatValue(global.$$REPL_RESULT$$);
  global.$$REPL_HAS_RESULT$$ = false;
  global.$$REPL_RESULT$$ = undefined;
  reportJSON({type: 'repl-result', text});
};
