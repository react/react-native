/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const replaceProtectedConstructors = require('../replaceProtectedConstructors');
const babel = require('@babel/core');

async function transform(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: ['@babel/plugin-syntax-typescript', replaceProtectedConstructors],
  });

  return result?.code ?? '';
}

describe('replaceProtectedConstructors', () => {
  test('should not modify class without annotation', async () => {
    const result = await transform(
      `declare class Foo {
  constructor(x: number);
}`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare class Foo {
  constructor(x: number);
}"
`);
  });

  test('should replace constructor with empty protected constructor()', async () => {
    const result = await transform(
      `/** @build-types protected-constructor */
declare class Foo {
  constructor(x: number, y: string);
  blur(): void;
}`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare class Foo {
  protected constructor();
  blur(): void;
}"
`);
  });

  test('should handle exported class', async () => {
    const result = await transform(
      `/** @build-types protected-constructor */
export declare class Foo {
  constructor(x: number);
}`,
    );
    expect(result).toMatchInlineSnapshot(`
"export declare class Foo {
  protected constructor();
}"
`);
  });

  test('should handle class with extends and implements', async () => {
    const result = await transform(
      `/** @build-types protected-constructor */
declare class Foo extends Bar implements Baz {
  constructor(tag: number, config: Config);
  focus(): void;
}`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare class Foo extends Bar implements Baz {
  protected constructor();
  focus(): void;
}"
`);
  });

  test('should preserve surrounding declarations', async () => {
    const result = await transform(
      `declare class Other {
  constructor(x: number);
}
/** @build-types protected-constructor */
declare class Foo {
  constructor(x: number);
}
declare class Another {
  constructor(y: string);
}`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare class Other {
  constructor(x: number);
}
declare class Foo {
  protected constructor();
}
declare class Another {
  constructor(y: string);
}"
`);
  });
});
