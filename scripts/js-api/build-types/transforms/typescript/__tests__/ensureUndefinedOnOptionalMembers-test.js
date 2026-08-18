/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const ensureUndefinedOnOptionalMembersVisitor = require('../ensureUndefinedOnOptionalMembers.js');
const babel = require('@babel/core');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      ensureUndefinedOnOptionalMembersVisitor,
    ],
  });

  return result.code;
}

describe('ensureUndefinedOnOptionalMembers', () => {
  test('should add undefined to optional type members', async () => {
    const code = `
      type Foo = {
        a?: number,
        'b-key'?: number | string,
        c?: () => void,
        d: boolean,
        e: string | undefined,
        f?: (() => void) | number,
      };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        a?: number | undefined;
        'b-key'?: number | string | undefined;
        c?: (() => void) | undefined;
        d: boolean;
        e: string | undefined;
        f?: (() => void) | number | undefined;
      };"
    `);
  });

  test('should not add undefined when already present', async () => {
    const code = `
      type Foo = {
        a?: number | undefined,
        b?: undefined,
      };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        a?: number | undefined;
        b?: undefined;
      };"
    `);
  });
});
