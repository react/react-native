/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

export type LayoutMap = Map<string, string>;

const RECORD_LAYOUT =
  /^\*\*\* Dumping AST Record Layout\n([\s\S]*?nvalign=\d+\])/gm;
const VTABLE =
  /^Vtable for '([^']+)' \(\d+ entries\)\.\n[\s\S]*?(?=\n\n|(?![\s\S]))/gm;
const SOURCE_LOCATION = /\(([^()]*?) at [^()]*?:\d+:\d+\)/g;
const HEX_ADDRESS = /0x[0-9a-f]{6,}/g;

function stripVolatile(text: string): string {
  return text.replace(SOURCE_LOCATION, '($1)').replace(HEX_ADDRESS, '0x');
}

/**
 * Splits a clang layout dump into one block per type whose name matches
 * `namespacePattern`. Keys are `L <type>` (record layout) and `V <type>`
 * (vtable). Source locations and hex addresses are stripped from keys and
 * values, so dumps of the same headers from different locations compare equal.
 */
function normalizeDump(
  raw: string,
  options: {namespacePattern: RegExp},
): LayoutMap {
  const layouts: LayoutMap = new Map();
  const add = (kind: 'L' | 'V', name: string, block: string) => {
    // Unnamed records and lambdas are named by source location; they are
    // covered by the layout of the record that contains them.
    if (name.search(SOURCE_LOCATION) !== -1) {
      return;
    }
    const key = `${kind} ${name}`;
    if (name.search(options.namespacePattern) !== -1 && !layouts.has(key)) {
      layouts.set(key, stripVolatile(block));
    }
  };

  for (const [, block] of raw.matchAll(RECORD_LAYOUT)) {
    const name = block
      .slice(0, block.indexOf('\n'))
      .replace(/^\s*0 \|\s*(?:struct |class |union )?/, '');
    add('L', name, block);
  }
  for (const [block, name] of raw.matchAll(VTABLE)) {
    add('V', name, block);
  }
  return layouts;
}

module.exports = {normalizeDump};
