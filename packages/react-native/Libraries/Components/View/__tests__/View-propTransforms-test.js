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

const {parse} = require('flow-parser');
const fs = require('node:fs');
const path = require('node:path');

function getFunction(ast, name) {
  const fn = ast.body.find(
    node => node.type === 'FunctionDeclaration' && node.id.name === name,
  );
  if (fn == null) {
    throw new Error(`Could not find \`${name}\` in View.js`);
  }
  return fn;
}

function keyName(node) {
  return node.type === 'Identifier' ? node.name : String(node.value);
}

// Every `props.x` / `props['x']` read in `node`.
function collectPropReads(node, keys) {
  if (node == null || typeof node !== 'object') {
    return keys;
  }
  if (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'props'
  ) {
    keys.add(keyName(node.property));
  }
  for (const key of Object.keys(node)) {
    if (key !== 'loc' && key !== 'range') {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => collectPropReads(c, keys));
      } else {
        collectPropReads(child, keys);
      }
    }
  }
  return keys;
}

// The named keys `transformProps` destructures out of `props`.
function collectDestructuredKeys(fn) {
  for (const statement of fn.body.body) {
    if (statement.type !== 'VariableDeclaration') {
      continue;
    }
    for (const declaration of statement.declarations) {
      if (
        declaration.id.type === 'ObjectPattern' &&
        declaration.init?.type === 'Identifier' &&
        declaration.init.name === 'props'
      ) {
        return new Set(
          declaration.id.properties
            .filter(property => property.type === 'Property')
            .map(property => keyName(property.key)),
        );
      }
    }
  }
  throw new Error('Could not find the props destructure in `transformProps`');
}

describe('View prop transforms', () => {
  it('skips the transform only when none of the transformed props are set', () => {
    const source = fs.readFileSync(path.join(__dirname, '../View.js'), 'utf8');
    const ast = parse(source, {components: true});

    const checked = collectPropReads(
      getFunction(ast, 'needsPropTransforms'),
      new Set(),
    );
    const transformed = collectDestructuredKeys(
      getFunction(ast, 'transformProps'),
    );

    // If this fails, a prop was added to (or removed from) `transformProps`
    // without updating `needsPropTransforms`, so Views that only set that prop
    // would skip the transform.
    expect([...checked].sort()).toEqual([...transformed].sort());
    expect(transformed.size).toBeGreaterThan(0);
  });
});
