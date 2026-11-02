/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceLegacyObjectWithObject = require('../replaceLegacyObjectWithObject');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceLegacyObjectWithObject(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceLegacyObjectWithObject', () => {
  test('should replace LegacyObject with Object in return annotation', async () => {
    const code = `function foo(): LegacyObject {}`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "function foo(): Object {}
      "
    `);
  });

  test('should replace LegacyObject with Object in nullable union', async () => {
    const code = `let foo: ?string | ?LegacyObject;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "let foo: ?string | ?Object;
      "
    `);
  });

  test('should replace LegacyObject with Object in type alias', async () => {
    const code = `type Foo = LegacyObject;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = Object;
      "
    `);
  });
});
