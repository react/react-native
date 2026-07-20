/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const resolveCyclicImportsInDefinition = require('../resolveCyclicImportsInDefinition');
const path = require('node:path');

const packagesPath = '/path/to/package/definition/files';

const packageConfig = [
  {directory: 'package1', name: 'package1'},
  {directory: 'package2', name: '@namespace/package2'},
];

describe('resolveCyclicImportsInDefinition', () => {
  test('should resolve type import from package', async () => {
    const code = `
    import type {Test1} from 'package1';
    import type {Test2} from '@namespace/package2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import type { Test1 } from \\"../package1\\";
      import type { Test2 } from \\"../package2\\";"
    `);
  });

  test('should resolve type import from deep import', async () => {
    const code = `
    import type {Test1} from 'package1/Test1';
    import type {Test2} from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import type { Test1 } from \\"../package1/Test1\\";
      import type { Test2 } from \\"../package2/Test2\\";"
    `);
  });

  test('should resolve named import from package', async () => {
    const code = `
    import {Test1} from 'package1';
    import {Test2} from '@namespace/package2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from \\"../package1\\";
      import { Test2 } from \\"../package2\\";"
    `);
  });

  test('should resolve named import from deep import', async () => {
    const code = `
    import {Test1} from 'package1/Test1';
    import {Test2} from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from \\"../package1/Test1\\";
      import { Test2 } from \\"../package2/Test2\\";"
    `);
  });

  test('should resolve default import from package', async () => {
    const code = `
    import Test1 from 'package1';
    import Test2 from '@namespace/package2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import Test1 from \\"../package1\\";
      import Test2 from \\"../package2\\";"
    `);
  });

  test('should resolve default import from deep import', async () => {
    const code = `
    import Test1 from 'package1/Test1';
    import Test2 from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import Test1 from \\"../package1/Test1\\";
      import Test2 from \\"../package2/Test2\\";"
    `);
  });

  test('should resolve import from a deeper file', async () => {
    const code = `
    import {Test1} from 'package1/Test1';
    import {Test2} from '@namespace/package2/Test2';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(
        packagesPath,
        'test',
        'deep',
        'in',
        'hierarchy',
        'index.d.ts',
      ),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "import { Test1 } from \\"../../../../package1/Test1\\";
      import { Test2 } from \\"../../../../package2/Test2\\";"
    `);
  });

  test('should resolve export declarations', async () => {
    const code = `
    export {Test1} from 'package1/Test1';
    export {Test2} from '@namespace/package2/Test2';
    export {default as Test3} from 'package1';`;
    const result = await resolveCyclicImportsInDefinition({
      source: code,
      sourcePath: path.join(packagesPath, 'test', 'index.d.ts'),
      rootPath: packagesPath,
      packages: packageConfig,
    });

    expect(result).toMatchInlineSnapshot(`
      "export { Test1 } from \\"../package1/Test1\\";
      export { Test2 } from \\"../package2/Test2\\";
      export { default as Test3 } from \\"../package1\\";"
    `);
  });
});
