/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

type HermesStackLocationNative = Readonly<{
  type: 'NATIVE',
}>;

type HermesStackLocationSource = Readonly<{
  type: 'SOURCE',
  sourceUrl: string,
  line1Based: number,
  column1Based: number,
}>;

type HermesStackLocationInternalBytecode = Readonly<{
  type: 'INTERNAL_BYTECODE',
  sourceUrl: string,
  line1Based: number,
  virtualOffset0Based: number,
}>;

type HermesStackLocationBytecode = Readonly<{
  type: 'BYTECODE',
  sourceUrl: string,
  line1Based: number,
  virtualOffset0Based: number,
}>;

type HermesStackLocation =
  | HermesStackLocationNative
  | HermesStackLocationSource
  | HermesStackLocationInternalBytecode
  | HermesStackLocationBytecode;

type HermesStackEntryFrame = Readonly<{
  type: 'FRAME',
  location: HermesStackLocation,
  functionName: string,
}>;

type HermesStackEntrySkipped = Readonly<{
  type: 'SKIPPED',
  count: number,
}>;

type HermesStackEntry = HermesStackEntryFrame | HermesStackEntrySkipped;

export type HermesParsedStack = Readonly<{
  message: string,
  entries: ReadonlyArray<HermesStackEntry>,
}>;

// Capturing groups:
// 1. function name
// 2. is this a native stack frame?
// 3. is this a bytecode address or a source location?
// 4. source URL (filename)
// 5. line number (1 based)
// 6. column number (1 based) or virtual offset (0 based)
const RE_FRAME =
  /^ {4}at (.+?)(?: \((native)\)?| \((address at )?(.*?):(\d+):(\d+)\))$/;

// Capturing groups:
// 1. count of skipped frames
const RE_SKIPPED = /^ {4}... skipping (\d+) frames$/;
const RE_COMPONENT_NO_STACK = /^ {4}at .*$/;

function isInternalBytecodeSourceUrl(sourceUrl: string): boolean {
  // See https://github.com/facebook/hermes/blob/3332fa020cae0bab751f648db7c94e1d687eeec7/lib/VM/Runtime.cpp#L1100
  return sourceUrl === 'InternalBytecode.js';
}

function parseLine(line: string): ?HermesStackEntry {
  const asFrame = line.match(RE_FRAME);
  if (asFrame) {
    return {
      type: 'FRAME',
      functionName: asFrame[1],
      location:
        asFrame[2] === 'native'
          ? {type: 'NATIVE'}
          : asFrame[3] === 'address at '
            ? isInternalBytecodeSourceUrl(asFrame[4])
              ? {
                  type: 'INTERNAL_BYTECODE',
                  sourceUrl: asFrame[4],
                  line1Based: Number.parseInt(asFrame[5], 10),
                  virtualOffset0Based: Number.parseInt(asFrame[6], 10),
                }
              : {
                  type: 'BYTECODE',
                  sourceUrl: asFrame[4],
                  line1Based: Number.parseInt(asFrame[5], 10),
                  virtualOffset0Based: Number.parseInt(asFrame[6], 10),
                }
            : {
                type: 'SOURCE',
                sourceUrl: asFrame[4],
                line1Based: Number.parseInt(asFrame[5], 10),
                column1Based: Number.parseInt(asFrame[6], 10),
              },
    };
  }
  const asSkipped = line.match(RE_SKIPPED);
  if (asSkipped) {
    return {
      type: 'SKIPPED',
      count: Number.parseInt(asSkipped[1], 10),
    };
  }
}

export default function parseHermesStack(stack: string): HermesParsedStack {
  const lines = stack.split(/\n/);
  let entries: Array<HermesStackEntryFrame | HermesStackEntrySkipped> = [];
  let lastMessageLine = -1;
  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    const entry = parseLine(line);
    if (entry) {
      entries.push(entry);
      continue;
    }
    if (RE_COMPONENT_NO_STACK.test(line)) {
      // Skip component stacks without source location.
      // TODO: This will not be displayed, not sure how to handle it.
      continue;
    }
    // No match - we're still in the message
    lastMessageLine = i;
    entries = [];
  }
  const message = lines.slice(0, lastMessageLine + 1).join('\n');
  return {message, entries};
}
