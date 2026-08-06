/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceEmptyWithNever = require('../replaceEmptyWithNever');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceEmptyWithNever(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceEmptyWithNever', () => {
  test('should replace empty with never in return annotation', async () => {
    const code = `function foo(): empty {}`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "function foo(): never {}
      "
    `);
  });

  test('should replace empty annotation with never in type annotation', async () => {
    const code = `let foo: empty;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "let foo: never;
      "
    `);
  });

  test('should replace empty annotation with never in type alias', async () => {
    const code = `type Foo = empty;`;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = never;
      "
    `);
  });
});
