/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TEMPLATE = fs.readFileSync(
  path.resolve(
    __dirname,
    '..',
    '..',
    'codegen',
    'templates',
    'Package.swift.spm-template',
  ),
  'utf8',
);

const RELEASE_O2 = '.unsafeFlags(["-O2"], .when(configuration: .release))';

// Returns the text between the bracket at `openIndex` and its matching close.
function balancedBody(source, openIndex) {
  const open = source[openIndex];
  const close = {'(': ')', '[': ']'}[open];
  let depth = 0;
  for (let i = openIndex; i < source.length; i++) {
    if (source[i] === open) {
      depth++;
    } else if (source[i] === close && --depth === 0) {
      return source.slice(openIndex + 1, i);
    }
  }
  throw new Error(`Unbalanced ${open} at index ${openIndex}`);
}

function targetBlock(name) {
  const re = /\.target\(/g;
  let match;
  while ((match = re.exec(TEMPLATE)) != null) {
    const body = balancedBody(TEMPLATE, match.index + '.target'.length);
    if (body.includes(`name: "${name}"`)) {
      return body;
    }
  }
  throw new Error(`Target ${name} not found in the codegen template`);
}

function settings(block, key) {
  const start = block.indexOf(`${key}: [`);
  if (start === -1) {
    return null;
  }
  return balancedBody(block, start + `${key}: `.length);
}

describe('codegen Package.swift.spm-template optimization level', () => {
  describe.each(['ReactCodegen', 'ReactAppDependencyProvider'])(
    '%s',
    targetName => {
      it.each(['cSettings', 'cxxSettings'])(
        'compiles at -O2 in Release via %s',
        key => {
          expect(settings(targetBlock(targetName), key)).toContain(RELEASE_O2);
        },
      );
    },
  );

  it('leaves the headers-only ReactAppHeaders target without flags', () => {
    expect(targetBlock('ReactAppHeaders')).not.toContain('unsafeFlags');
  });
});
