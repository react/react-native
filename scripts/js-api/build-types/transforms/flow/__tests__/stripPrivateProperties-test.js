/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const stripPrivateProperties = require('../stripPrivateProperties');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await stripPrivateProperties(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('stripPrivateProperties', () => {
  test('should strip private properties', async () => {
    const code = `const Foo = {
      foo: 'foo',
      bar() {},
      _privateFoo: 'privateFoo',
      _privateBar() {},
    }`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "const Foo = {
        foo: \\"foo\\",
        bar() {},
      };
      "
    `);
  });
});
