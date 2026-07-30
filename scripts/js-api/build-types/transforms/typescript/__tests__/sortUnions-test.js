/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const sortUnionsVisitor = require('../sortUnions');
const babel = require('@babel/core');
const {promises: fs} = require('node:fs');
const path = require('node:path');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', sortUnionsVisitor],
  });

  return result.code;
}

describe('sortUnions', () => {
  test('should sort union members', async () => {
    const code = await fs.readFile(
      path.join(__dirname, '../__fixtures__/sortUnions.d.ts'),
      'utf-8',
    );
    const result = await translate(code);
    expect(result).toMatchSnapshot();
  });
});
