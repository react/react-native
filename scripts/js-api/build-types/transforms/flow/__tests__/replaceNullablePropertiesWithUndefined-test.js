/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceNullablePropertiesWithUndefined = require('../replaceNullablePropertiesWithUndefined');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceNullablePropertiesWithUndefined(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceNullablePropertiesWithUndefined', () => {
  test('should not replace nullable with undefined outside object type definition', async () => {
    const code = `function foo(arg: ?string) {}`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "function foo(arg: ?string) {}
      "
    `);
  });

  test('should replace nullable with undefined inside object type definition', async () => {
    const code = `type Foo = {bar: ?string};`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = { bar: string | undefined };
      "
    `);
  });

  test('should replace nullable with undefined inside nested object type definition', async () => {
    const code = `type Foo = {bar: {baz: ?string}};`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = { bar: { baz: string | undefined } };
      "
    `);
  });

  test('should replace nullable with undefined in function inside object type definition', async () => {
    const code = `type Foo = {bar: (?string) => void};`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = { bar: (string | undefined) => void };
      "
    `);
  });
});
