/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const createVersionExportedApis = require('../versionExportedApis');
const babel = require('@babel/core');
const {diff} = require('jest-diff');
const prettier = require('prettier');

async function translate(code: string): Promise<string> {
  const result = await babel.transformAsync(code, {
    plugins: [
      '@babel/plugin-syntax-typescript',
      createVersionExportedApis(true),
    ],
  });

  return prettier.format(result.code, {
    parser: 'typescript',
  });
}

function diffCode(code1: string, code2: string) {
  const noColor = (string: string) => string;

  const diffLines = diff(code1, code2, {
    aAnnotation: 'First input',
    bAnnotation: 'Second input',
    aColor: noColor,
    bColor: noColor,
    changeColor: noColor,
    commonColor: noColor,
    patchColor: noColor,
  });
  return diffLines;
}

describe('versionExportedApis', () => {
  test('should version simple reference', async () => {
    const code = `
      type Foo = string;
      export { Foo };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = string;
      export {
        Foo, // ca41d8a9, Deps: [], Total: 0
      };
      "
    `);
  });

  test('should find direct dependency', async () => {
    const code = `
      type Foo = string;
      type Bar = Foo;
      export { Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = string;
      type Bar = Foo;
      export {
        Bar, // 07ea8913, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      };
      "
    `);
  });

  test('should find direct and transitive dependencies', async () => {
    const code = `
      type Foo = string;
      type Bar = Foo;
      type Baz = Bar;
      export { Baz };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = string;
      type Bar = Foo;
      type Baz = Bar;
      export {
        Baz, // eb07d2f9, Deps: [Bar, Foo], Total: 2, Tree: Baz→[Bar];Bar→[Foo]
      };
      "
    `);
  });

  test('should handle dependency in interface extends declaration', async () => {
    const code = `
      type Foo = {};
      interface Bar extends Foo {}
      export { Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {};
      interface Bar extends Foo {}
      export {
        Bar, // 57ff6085, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      };
      "
    `);
  });

  test('should handle dependency in class extends declaration', async () => {
    const code = `
      class Foo {};
      class Bar extends Foo {}
      export { Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "class Foo {}
      class Bar extends Foo {}
      export {
        Bar, // ac0089b3, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      };
      "
    `);
  });

  test('should handle dependency in class implements declaration', async () => {
    const code = `
      interface Foo {};
      class Bar implements Foo {}
      export { Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "interface Foo {}
      class Bar implements Foo {}
      export {
        Bar, // 3e0bcbe8, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      };
      "
    `);
  });

  test('should handle dependency in type parameters', async () => {
    const code = `
      type Foo<T> = { x: T };
      type Bar = string;
      type Baz = Foo<Bar>;
      export { Baz };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo<T> = {
        x: T;
      };
      type Bar = string;
      type Baz = Foo<Bar>;
      export {
        Baz, // 9982a945, Deps: [Foo, Bar], Total: 2, Tree: Baz→[Foo,Bar]
      };
      "
    `);
  });

  test('should handle type parameter constraints and defaults', async () => {
    const code = `
      type Base = { id: string };
      type Extended = { name: string };
      type Generic<T extends Base = Extended> = { data: T };
      export { Generic };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Base = {
        id: string;
      };
      type Extended = {
        name: string;
      };
      type Generic<T extends Base = Extended> = {
        data: T;
      };
      export {
        Generic, // 6bba44eb, Deps: [Base, Extended], Total: 2, Tree: Generic→[Base,Extended]
      };
      "
    `);
  });

  test('should handle recursive type definitions', async () => {
    const code = `
      type TreeNode<T> = {
        value: T;
        children: TreeNode<T>[];
      };
      export { TreeNode };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type TreeNode<T> = {
        value: T;
        children: TreeNode<T>[];
      };
      export {
        TreeNode, // ac34982c, Deps: [], Total: 0, Tree: TreeNode→[TreeNode]
      };
      "
    `);
  });

  test('should handle indexed access of the dependency', async () => {
    const code = `
      type Foo = { x: string };
      type FooParam = 'x';
      type Bar = Foo[FooParam];
      export { Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        x: string;
      };
      type FooParam = \\"x\\";
      type Bar = Foo[FooParam];
      export {
        Bar, // fa79e1ed, Deps: [Foo, FooParam], Total: 2, Tree: Bar→[Foo,FooParam]
      };
      "
    `);
  });

  test('should handle dependencies in unions', async () => {
    const code = `
      type Foo = { x: string };
      type Bar = {};
      type Baz = {};
      type Qux = Foo | Bar | Baz;
      export { Qux };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        x: string;
      };
      type Bar = {};
      type Baz = {};
      type Qux = Foo | Bar | Baz;
      export {
        Qux, // a1788b20, Deps: [Foo, Bar, Baz], Total: 3, Tree: Qux→[Foo,Bar,Baz]
      };
      "
    `);
  });

  test('should handle dependencies in intersections', async () => {
    const code = `
      type Foo = { x: string };
      type Bar = {};
      type Baz = {};
      type Qux = Foo & Bar & Baz;
      export { Qux };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        x: string;
      };
      type Bar = {};
      type Baz = {};
      type Qux = Foo & Bar & Baz;
      export {
        Qux, // 4e43acb7, Deps: [Foo, Bar, Baz], Total: 3, Tree: Qux→[Foo,Bar,Baz]
      };
      "
    `);
  });

  test('should handle dependencies in namespaces', async () => {
    const code = `
      type Foo = {};
      type Bar = {};
      type Baz = {};
      declare namespace Qux {
        export { Foo, Bar, Baz };
      };
      export { Qux };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {};
      type Bar = {};
      type Baz = {};
      declare namespace Qux {
        export { Foo, Bar, Baz };
      }
      export {
        Qux, // 592e0e02, Deps: [Foo, Bar, Baz], Total: 3, Tree: Qux→[Foo,Bar,Baz]
      };
      "
    `);
  });

  test('should handle dependencies in type operators', async () => {
    const code = `
      type Foo = { x: string };
      type Bar = keyof Foo;
      export { Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        x: string;
      };
      type Bar = keyof Foo;
      export {
        Bar, // 8422a5b6, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      };
      "
    `);
  });

  test('should handle tuple type dependencies', async () => {
    const code = `
      type Foo = string;
      type Bar = number;
      type Tuple = [Foo, Bar];
      export { Tuple };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = string;
      type Bar = number;
      type Tuple = [Foo, Bar];
      export {
        Tuple, // f4accc34, Deps: [Foo, Bar], Total: 2, Tree: Tuple→[Foo,Bar]
      };
      "
    `);
  });

  test('should handle function type dependencies', async () => {
    const code = `
      type Param = string;
      type Return = number;
      type Func = (param: Param) => Return;
      export { Func };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Param = string;
      type Return = number;
      type Func = (param: Param) => Return;
      export {
        Func, // 03d858df, Deps: [Param, Return], Total: 2, Tree: Func→[Param,Return]
      };
      "
    `);
  });

  test('should handle function type parameters dependencies', async () => {
    const code = `
      type Foo = {};
      type Func = <T>(param: T) => T;
      type ConcreteFunc = Func<Foo>;
      export { ConcreteFunc };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {};
      type Func = <T>(param: T) => T;
      type ConcreteFunc = Func<Foo>;
      export {
        ConcreteFunc, // d32a27d2, Deps: [Func, Foo], Total: 2, Tree: ConcreteFunc→[Func,Foo]
      };
      "
    `);
  });

  test('should handle array type dependencies', async () => {
    const code = `
      type Item = string;
      type List1 = Item[];
      type List2 = Array<Item>;
      export { List1, List2 };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Item = string;
      type List1 = Item[];
      type List2 = Array<Item>;
      export {
        List1, // 99fbb7c1, Deps: [Item], Total: 1, Tree: List1→[Item]
        List2, // b6bd4820, Deps: [Item], Total: 1, Tree: List2→[Item]
      };
      "
    `);
  });

  test('should handle dependencies in conditional types', async () => {
    const code = `
      type Foo = { x: string };
      type Bar = {};
      type Baz = {};
      type Qux = {};
      type Quy = Foo extends Bar ? Baz : Qux;
      export { Quy };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        x: string;
      };
      type Bar = {};
      type Baz = {};
      type Qux = {};
      type Quy = Foo extends Bar ? Baz : Qux;
      export {
        Quy, // 8acec0e7, Deps: [Foo, Bar, Baz, Qux], Total: 4, Tree: Quy→[Foo,Bar,Baz,Qux]
      };
      "
    `);
  });

  test('should handle dependencies in mapped types', async () => {
    const code = `
      type Foo = { x: string };
      type Bar = {};
      type Qux = {
        [K in keyof Foo]: Bar;
      };
      export { Qux };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        x: string;
      };
      type Bar = {};
      type Qux = { [K in keyof Foo]: Bar };
      export {
        Qux, // d37e43ef, Deps: [Foo, Bar], Total: 2, Tree: Qux→[Foo,Bar]
      };
      "
    `);
  });

  test('should handle circular dependencies', async () => {
    const code = `
      type Foo = { bar: Bar };
      type Bar = { foo: Foo };
      export { Foo, Bar };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = {
        bar: Bar;
      };
      type Bar = {
        foo: Foo;
      };
      export {
        Foo, // e8becdf1, Deps: [Bar], Total: 1, Tree: Foo→[Bar];Bar→[Foo]
        Bar, // c25021fd, Deps: [Foo], Total: 1, Tree: Bar→[Foo];Foo→[Bar]
      };
      "
    `);
  });

  test('should handle function declarations', async () => {
    const code = `
      type Foo = string;
      type Bar = void;
      declare function myFunc(param: Foo): Bar;
      export { myFunc };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Foo = string;
      type Bar = void;
      declare function myFunc(param: Foo): Bar;
      export {
        myFunc, // 56ab0754, Deps: [Foo, Bar], Total: 2, Tree: myFunc→[Foo,Bar]
      };
      "
    `);
  });

  test('should handle enum declarations', async () => {
    const code = `
      enum Color { Red, Green, Blue }
      type MyColor = Color;
      export { MyColor };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "enum Color {
        Red,
        Green,
        Blue,
      }
      type MyColor = Color;
      export {
        MyColor, // a4ae81e5, Deps: [Color], Total: 1, Tree: MyColor→[Color]
      };
      "
    `);
  });

  test('annotations should be stable', async () => {
    const code = `
      type Foo = string;
      type Bar = Foo;
      type Baz = Bar;
      export { Foo, Bar, Baz };
    `;
    const result1 = await translate(code);
    const result2 = await translate(code);
    expect(result1).toEqual(result2);
  });

  test('should handle external type references gracefully', async () => {
    const code = `
      type MyPromise = Promise<string>;
      type MyOmit<T, K> = Omit<T, K>;
      type ReactNode = React.Node;
      export { MyPromise, MyOmit, ReactNode };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type MyPromise = Promise<string>;
      type MyOmit<T, K> = Omit<T, K>;
      type ReactNode = React.Node;
      export {
        MyPromise, // aeb4aa0b, Deps: [], Total: 0
        MyOmit, // 1e21fc01, Deps: [], Total: 0
        ReactNode, // 8a0f5922, Deps: [], Total: 0
      };
      "
    `);
  });

  test('should handle template literal type dependencies', async () => {
    const code = `
      type Prefix = 'user';
      type Suffix = 'id' | 'name';
      type Template = \`\${Prefix}_\${Suffix}\`;
      export { Template };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type Prefix = \\"user\\";
      type Suffix = \\"id\\" | \\"name\\";
      type Template = \`\${Prefix}_\${Suffix}\`;
      export {
        Template, // f99c26ae, Deps: [Prefix, Suffix], Total: 2, Tree: Template→[Prefix,Suffix]
      };
      "
    `);
  });

  test('type change should update only its dependants', async () => {
    const code1 = `
      type Foo = string;
      type Bar = Foo;
      type Baz = Bar;

      type Qux = string;
      type Quy = Qux;
      type Quz = Quy;
      export { Foo, Bar, Baz, Qux, Quy, Quz };
    `;
    const result1 = await translate(code1);

    const code2 = `
      type Foo = number;
      type Bar = Foo;
      type Baz = Bar;

      type Qux = string;
      type Quy = Qux;
      type Quz = Quy;
      export { Foo, Bar, Baz, Qux, Quy, Quz };
    `;
    const result2 = await translate(code2);

    expect(diffCode(result1, result2)).toMatchInlineSnapshot(`
      "- First input
      + Second input

      - type Foo = string;
      + type Foo = number;
        type Bar = Foo;
        type Baz = Bar;
        type Qux = string;
        type Quy = Qux;
        type Quz = Quy;
        export {
      -   Foo, // ca41d8a9, Deps: [], Total: 0
      -   Bar, // ea7ebcdd, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      -   Baz, // 4dfe96e7, Deps: [Bar, Foo], Total: 2, Tree: Baz→[Bar];Bar→[Foo]
      +   Foo, // b899908e, Deps: [], Total: 0
      +   Bar, // 5a6dec8c, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      +   Baz, // 6802403a, Deps: [Bar, Foo], Total: 2, Tree: Baz→[Bar];Bar→[Foo]
          Qux, // 13493f2b, Deps: [], Total: 0
          Quy, // dd245137, Deps: [Qux], Total: 1, Tree: Quy→[Qux]
          Quz, // 19da3401, Deps: [Quy, Qux], Total: 2, Tree: Quz→[Quy];Quy→[Qux]
        };
      "
    `);
  });

  test('type change should update all of its dependants', async () => {
    const code1 = `
      type Foo = string;
      type Bar = Foo;
      type Baz = Bar;

      type Qux = Foo;
      type Quy = Qux;
      type Quz = Quy;
      export { Foo, Bar, Baz, Qux, Quy, Quz };
    `;
    const result1 = await translate(code1);

    const code2 = `
      type Foo = number;
      type Bar = Foo;
      type Baz = Bar;

      type Qux = string;
      type Quy = Qux;
      type Quz = Quy;
      export { Foo, Bar, Baz, Qux, Quy, Quz };
    `;
    const result2 = await translate(code2);

    expect(diffCode(result1, result2)).toMatchInlineSnapshot(`
      "- First input
      + Second input

      - type Foo = string;
      + type Foo = number;
        type Bar = Foo;
        type Baz = Bar;
      - type Qux = Foo;
      + type Qux = string;
        type Quy = Qux;
        type Quz = Quy;
        export {
      -   Foo, // ca41d8a9, Deps: [], Total: 0
      -   Bar, // ea7ebcdd, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      -   Baz, // 4dfe96e7, Deps: [Bar, Foo], Total: 2, Tree: Baz→[Bar];Bar→[Foo]
      -   Qux, // c5376a1c, Deps: [Foo], Total: 1, Tree: Qux→[Foo]
      -   Quy, // 6f0fb618, Deps: [Qux, Foo], Total: 2, Tree: Quy→[Qux];Qux→[Foo]
      -   Quz, // 8ae4bb91, Deps: [Quy, Qux, Foo], Total: 3, Tree: Quz→[Quy];Quy→[Qux];Qux→[Foo]
      +   Foo, // b899908e, Deps: [], Total: 0
      +   Bar, // 5a6dec8c, Deps: [Foo], Total: 1, Tree: Bar→[Foo]
      +   Baz, // 6802403a, Deps: [Bar, Foo], Total: 2, Tree: Baz→[Bar];Bar→[Foo]
      +   Qux, // 13493f2b, Deps: [], Total: 0
      +   Quy, // dd245137, Deps: [Qux], Total: 1, Tree: Quy→[Qux]
      +   Quz, // 19da3401, Deps: [Quy, Qux], Total: 2, Tree: Quz→[Quy];Quy→[Qux]
        };
      "
    `);
  });

  test('all dependencies should be included in hash', async () => {
    const code1 = `
      type Foo = string;
      type Bar = number;
      type Baz = Foo | Bar;

      export { Baz };
    `;
    const result1 = await translate(code1);

    const code2 = `
      type Foo = boolean;
      type Bar = number;
      type Baz = Foo | Bar;

      export { Baz };
    `;
    const result2 = await translate(code2);

    expect(diffCode(result1, result2)).toMatchInlineSnapshot(`
      "- First input
      + Second input

      - type Foo = string;
      + type Foo = boolean;
        type Bar = number;
        type Baz = Foo | Bar;
        export {
      -   Baz, // 27c295c3, Deps: [Foo, Bar], Total: 2, Tree: Baz→[Foo,Bar]
      +   Baz, // 3010e9ba, Deps: [Foo, Bar], Total: 2, Tree: Baz→[Foo,Bar]
        };
      "
    `);

    const code3 = `
      type Foo = boolean;
      type Bar = unknown;
      type Baz = Foo | Bar;

      export { Baz };
    `;
    const result3 = await translate(code3);

    expect(diffCode(result2, result3)).toMatchInlineSnapshot(`
      "- First input
      + Second input

        type Foo = boolean;
      - type Bar = number;
      + type Bar = unknown;
        type Baz = Foo | Bar;
        export {
      -   Baz, // 3010e9ba, Deps: [Foo, Bar], Total: 2, Tree: Baz→[Foo,Bar]
      +   Baz, // f3670060, Deps: [Foo, Bar], Total: 2, Tree: Baz→[Foo,Bar]
        };
      "
    `);
  });

  test('should handle typeof with declare const and track dependencies', async () => {
    const code = `
      type AccessibilityInfo_default = {
        isScreenReaderEnabled: () => Promise<boolean>;
      };
      declare const AccessibilityInfo: typeof AccessibilityInfo_default;
      declare type AccessibilityInfo = typeof AccessibilityInfo;
      export { AccessibilityInfo };
    `;
    const result = await translate(code);
    expect(result).toMatchInlineSnapshot(`
      "type AccessibilityInfo_default = {
        isScreenReaderEnabled: () => Promise<boolean>;
      };
      declare const AccessibilityInfo: typeof AccessibilityInfo_default;
      declare type AccessibilityInfo = typeof AccessibilityInfo;
      export {
        AccessibilityInfo, // 2b0c85e6, Deps: [AccessibilityInfo_default], Total: 1, Tree: AccessibilityInfo→[AccessibilityInfo_default]
      };
      "
    `);
  });
});
