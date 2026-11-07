/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const createReplaceDefaultExportName = require('../replaceDefaultExportName');
const babel = require('@babel/core');
const flowApiTranslator = require('flow-api-translator');
const path = require('node:path');

const prettierOptions = {parser: 'babel'};

async function translate(code: string, fileName: string): Promise<string> {
  const tsDef = await flowApiTranslator.translateFlowToTSDef(
    code,
    prettierOptions,
  );
  const result = await babel.transformAsync(tsDef, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      createReplaceDefaultExportName(fileName),
    ],
  });

  return result.code;
}

describe('replaceDefaultExportName', () => {
  test('should replace default export name with unambiguous one', async () => {
    const code = `export default Foo;`;
    const result = await translate(
      code,
      path.join('mock', 'path', 'to', 'module', 'Foo.js'),
    );
    expect(result).toMatchInlineSnapshot(`
      "declare const $$Foo: typeof Foo;
      declare type $$Foo = typeof $$Foo;
      export default $$Foo;"
    `);
  });
});
