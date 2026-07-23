/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const removeUndefinedFromOptionalMembersVisitor = require('../removeUndefinedFromOptionalMembers.js');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      removeUndefinedFromOptionalMembersVisitor,
    ],
  });

  return result.code;
}

describe('removeUndefinedFromOptionalMembers', () => {
  test('should remove undefined from optional type members', async () => {
    const code = `
      type Foo = {
        a?: number | undefined,
        'b-key'?: number,
        c: boolean | undefined,
        d: string,
      };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        a?: number;
        'b-key'?: number;
        c: boolean | undefined;
        d: string;
      };"
    `);
  });

  test('should unwrap the lone remaining constituent, dropping redundant parens', async () => {
    const code = `
      type Foo = {
        a?: (() => void) | undefined,
        b?: number | string | undefined,
      };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        a?: () => void;
        b?: number | string;
      };"
    `);
  });
});
