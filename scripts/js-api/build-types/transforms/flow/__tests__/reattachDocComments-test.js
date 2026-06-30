/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const reattachDocComments = require('../reattachDocComments');
const {parse, print} = require('hermes-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await reattachDocComments(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

/**
 * Assert that `marker` appears exactly once (moved, not duplicated) and is the
 * leading comment of the `export default` declaration.
 */
function expectDocOnDefaultExport(result: string, marker: string): void {
  expect(result.split(marker).length - 1).toBe(1);
  expect(result).toMatch(
    new RegExp(`/\\*\\*[\\s\\S]*?${marker}[\\s\\S]*?\\*/\\s*export default`),
  );
}

describe('reattachDocComments', () => {
  test('should move component doc block', async () => {
    const code = `
        import Bar from './Bar';

        /**
         * Foo documentation
         */
        let Foo: component(
        ref?: React.RefSetter<
            React.ElementRef<FooType>,
        >,
        ...props: FooProps
        );

        export default Foo;
    `;

    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "import Bar from \\"./Bar\\";

      let Foo: component(
        ref?: React.RefSetter<React.ElementRef<FooType>>,
        ...props: FooProps
      );

      /**
       * Foo documentation
       */
      export default Foo;
      "
    `);
  });

  test('should move variable doc block', async () => {
    const code = `
        const bar = 'bar';
        /**
         * Foo documentation
         */
        const Foo: component(
        ref?: React.RefSetter<
            React.ElementRef<FooType>,
        >,
        ...props: FooProps
        ) = () => {};

        export default Foo;
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "const bar = \\"bar\\";
      const Foo: component(
        ref?: React.RefSetter<React.ElementRef<FooType>>,
        ...props: FooProps
      ) = () => {};

      /**
       * Foo documentation
       */
      export default Foo;
      "
    `);
  });

  test('should move doc block from a `component` declaration', async () => {
    const code = `
        import * as React from 'react';

        /**
         * Foo documentation
         */
        component Foo(...props: FooProps) {
          return null;
        }

        Foo.displayName = 'Foo';

        export default Foo;
    `;
    const result = await translate(code);
    expectDocOnDefaultExport(result, 'Foo documentation');
  });

  test('should move doc block from a memo-wrapped component via its display name', async () => {
    const code = `
        import * as React from 'react';

        /**
         * Foo documentation
         */
        function Foo(props: FooProps) {
          return null;
        }

        const MemoedFoo = memo(Foo);
        MemoedFoo.displayName = 'Foo';

        export default MemoedFoo;
    `;
    const result = await translate(code);
    expectDocOnDefaultExport(result, 'Foo documentation');
  });

  test('should move doc block from the public (display) named declaration', async () => {
    const code = `
        import * as React from 'react';

        /**
         * Foo documentation
         */
        class Foo extends React.Component<FooProps> {}

        const FooWrapper = (props: FooProps) => null;
        FooWrapper.displayName = 'Foo';

        export default FooWrapper;
    `;
    const result = await translate(code);
    expectDocOnDefaultExport(result, 'Foo documentation');
  });

  test('should reattach through an `as` cast in the default export', async () => {
    const code = `
        import * as React from 'react';

        /**
         * Foo documentation
         */
        const Foo = (props: FooProps) => null;

        export default Foo as FooType;
    `;
    const result = await translate(code);
    expectDocOnDefaultExport(result, 'Foo documentation');
  });

  test('should leave the doc block on a directly class-exported declaration', async () => {
    const code = `
        import * as React from 'react';

        /**
         * Foo documentation
         */
        class Foo extends React.Component<FooProps> {}

        export default Foo;
    `;
    const result = await translate(code);
    // TypeScript resolves the doc on the class declaration; it must stay there
    // and must not be moved onto the `export default` statement.
    expect(result.split('Foo documentation').length - 1).toBe(1);
    expect(result).toMatch(/\*\/\s*class Foo/);
    expect(result).not.toMatch(/\*\/\s*export default/);
  });

  test('should move doc block from a `declare const` (.js.flow stub)', async () => {
    const code = `
        'use strict';

        /**
         * Foo documentation
         */
        declare const Foo: {bar(): void};

        export default Foo;
    `;
    const result = await translate(code);
    expectDocOnDefaultExport(result, 'Foo documentation');
  });

  test('should reattach for `declare export default typeof Foo`', async () => {
    const code = `
        'use strict';

        /**
         * Foo documentation
         */
        declare const Foo: {bar(): void};

        declare export default typeof Foo;
    `;
    const result = await translate(code);
    expect(result.split('Foo documentation').length - 1).toBe(1);
    expect(result).toMatch(
      /\/\*\*[\s\S]*?Foo documentation[\s\S]*?\*\/\s*declare export default/,
    );
  });

  test('should not duplicate a doc block already on the default export', async () => {
    const code = `
        const Foo = (props: FooProps) => null;

        /**
         * Foo documentation
         */
        export default Foo;
    `;
    const result = await translate(code);
    expectDocOnDefaultExport(result, 'Foo documentation');
  });

  test('should ignore build directive comments', async () => {
    const code = `
        import * as React from 'react';

        /** @build-types emit-as-interface */
        const Foo = (props: FooProps) => null;

        export default Foo;
    `;
    const result = await translate(code);
    // The directive must not be moved onto (or left as a leading comment of)
    // the default export.
    expect(result).not.toMatch(/\*\/\s*export default/);
  });
});
