/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceStringishWithString = require('../replaceStringishWithString');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceStringishWithString(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceStringishWithString', () => {
  test('should replace Stringish with string in return annotation', async () => {
    const code = `function foo(): Stringish {}`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "function foo(): string {}
      "
    `);
  });

  test('should replace Stringish annotation with string in type annotation', async () => {
    const code = `let foo: Stringish;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "let foo: string;
      "
    `);
  });

  test('should replace Stringish annotation with string in type alias', async () => {
    const code = `type Foo = Stringish;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = string;
      "
    `);
  });
});
