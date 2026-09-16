/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const organizeDeclarations = require('../organizeDeclarations');
const babel = require('@babel/core');
const {promises: fs} = require('node:fs');
const path = require('node:path');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', organizeDeclarations],
  });

  return result.code;
}

describe('organizeDeclarations', () => {
  test('should sort declarations and move exports into single export block', async () => {
    const code = await fs.readFile(
      path.join(__dirname, '../__fixtures__/organizeDeclarations.d.ts'),
      'utf-8',
    );
    const result = await translate(code);
    expect(result).toMatchSnapshot();
  });
});
