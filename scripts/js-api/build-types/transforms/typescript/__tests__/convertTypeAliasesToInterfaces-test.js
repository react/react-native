/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const convertTypeAliasesToInterfaces = require('../convertTypeAliasesToInterfaces');
const babel = require('@babel/core');

async function transform(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      convertTypeAliasesToInterfaces,
    ],
  });

  return result?.code ?? '';
}

describe('convertTypeAliasesToInterfaces', () => {
  test('should not convert type without annotation', async () => {
    const result = await transform(
      'declare type ViewProps = Readonly<A & B & C>',
    );
    expect(result).toBe('declare type ViewProps = Readonly<A & B & C>;');
  });

  test('should convert Readonly intersection of type references', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type ViewProps = Readonly<A & B & C>`,
    );
    expect(result).toMatchInlineSnapshot(
      `"declare interface ViewProps extends Readonly<A & B & C> {}"`,
    );
  });

  test('should convert Readonly intersection with inline object literal', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type Props = Readonly<A & B & { x?: string; y: number }>`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare interface Props extends Readonly<A & B> {
  readonly x?: string;
  readonly y: number;
}"
`);
  });

  test('should convert Readonly wrapping pure object literal', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type Props = Readonly<{ a: string; b?: number }>`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare interface Props {
  readonly a: string;
  readonly b?: number;
}"
`);
  });

  test('should convert plain object literal without Readonly', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type Props = { readonly a: string; readonly b?: number }`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare interface Props {
  readonly a: string;
  readonly b?: number;
}"
`);
  });

  test('should convert intersection without Readonly', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type Props = A & B`,
    );
    expect(result).toMatchInlineSnapshot(
      `"declare interface Props extends Readonly<A & B> {}"`,
    );
  });

  test('should preserve generic type parameters', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type FlatListProps<ItemT> = Omit<VLP, "data"> & BaseProps<ItemT>`,
    );
    expect(result).toMatchInlineSnapshot(
      `"declare interface FlatListProps<ItemT> extends Readonly<Omit<VLP, \\"data\\"> & BaseProps<ItemT>> {}"`,
    );
  });

  test('should handle Readonly wrapping Omit in intersection', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type Props = Readonly<Omit<ViewProps, "style"> & { alt?: string }>`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare interface Props extends Readonly<Omit<ViewProps, \\"style\\">> {
  readonly alt?: string;
}"
`);
  });

  test('should preserve surrounding declarations', async () => {
    const result = await transform(
      `declare type Foo = string;
/** @build-types emit-as-interface */
declare type Bar = Readonly<A & B>;
declare type Baz = number;`,
    );
    expect(result).toMatchInlineSnapshot(`
"declare type Foo = string;
declare interface Bar extends Readonly<A & B> {}
declare type Baz = number;"
`);
  });

  test('should convert exported type with annotation on export', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
export type Props = Readonly<A & B>`,
    );
    expect(result).toMatchInlineSnapshot(
      `"export interface Props extends Readonly<A & B> {}"`,
    );
  });

  test('should throw on unsupported type structure', async () => {
    await expect(
      transform(
        `/** @build-types emit-as-interface */
declare type Props = string | number`,
      ),
    ).rejects.toThrow(
      "Unsupported type structure for @build-types emit-as-interface on 'Props'",
    );
  });

  test('should handle single type reference', async () => {
    const result = await transform(
      `/** @build-types emit-as-interface */
declare type Props = Readonly<ViewProps>`,
    );
    expect(result).toMatchInlineSnapshot(
      `"declare interface Props extends Readonly<ViewProps> {}"`,
    );
  });
});
