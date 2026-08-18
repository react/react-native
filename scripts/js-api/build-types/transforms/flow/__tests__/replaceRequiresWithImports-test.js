/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceRequiresWithImports = require('../replaceRequiresWithImports');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceRequiresWithImports(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceRequiresWithImports', () => {
  test('should replace require().default with a default import', async () => {
    const code = `
    const Foo: mixed = require('./Foo').default;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import Foo from \\"./Foo\\";
      "
    `);
  });

  test('should replace require() with a namespace import', async () => {
    const code = `
    const Foo: mixed = require('./Foo');
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import * as Foo from \\"./Foo\\";
      "
    `);
  });

  test('should replace require().member with an import', async () => {
    const code = `
    const Foo: mixed = require('./Foo').foo;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import { foo as Foo } from \\"./Foo\\";
      "
    `);
  });

  test('should replace require()["member"] with an import', async () => {
    const code = `
    const Foo: mixed = require('./Foo')["foo"];
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import { foo as Foo } from \\"./Foo\\";
      "
    `);
  });

  test('should replace spread require() with an import', async () => {
    const code = `
    const { foo, bar } = require('./Foo');
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import { foo, bar } from \\"./Foo\\";
      "
    `);
  });

  test('should replace aliased spread require() with an import', async () => {
    const code = `
    const { foo: otherFoo, bar: otherBar } = require('./Foo');
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import { foo as otherFoo, bar as otherBar } from \\"./Foo\\";
      "
    `);
  });

  test('should handle aliased and non-aliased values in spread require() with an import', async () => {
    const code = `
    const { default: defaultFoo, foo } = require('./Foo');
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import { default as defaultFoo, foo } from \\"./Foo\\";
      "
    `);
  });

  test('should ignore unbound requires', async () => {
    const code = `
    require('./Foo');
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "require(\\"./Foo\\");
      "
    `);
  });

  test('should ignore local requires', async () => {
    const code = `
    function foo() {
      const bar = require('./Bar');
    }
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "function foo() {
        const bar = require(\\"./Bar\\");
      }
      "
    `);
  });

  test('should throw when encountering spread operator', async () => {
    const tranlsateFn = async () => {
      const code = `
      const { foo, ...rest } = require('./Foo');
      `;
      await translate(code);
    };
    await expect(tranlsateFn()).rejects.toThrow();
  });
});
