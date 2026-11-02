/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const translateSourceFile = require('../../../translateSourceFile');
const replaceLegacyFunctionWithFunction = require('../replaceLegacyFunctionWithFunction');
const {parse, print} = require('flow-transform');

const prettierOptions = {parser: 'babel'};

async function translate(code: string): Promise<string> {
  const parsed = await parse(code);
  const result = await replaceLegacyFunctionWithFunction(parsed);
  return print(result.ast, result.mutatedCode, prettierOptions);
}

describe('replaceLegacyFunctionWithFunction', () => {
  test('replaces LegacyFunction in return annotations', async () => {
    expect(await translate('function foo(): LegacyFunction {}')).toBe(
      'function foo(): Function {}\n',
    );
  });

  test('replaces LegacyFunction in nullable unions', async () => {
    expect(
      await translate('let foo: ?((value?: string) => any) | ?LegacyFunction;'),
    ).toBe('let foo: ?((value?: string) => any) | ?Function;\n');
  });

  test('replaces LegacyFunction in type aliases', async () => {
    expect(await translate('type Foo = LegacyFunction;')).toBe(
      'type Foo = Function;\n',
    );
  });

  test('preserves unrelated and qualified types', async () => {
    const code = 'type Foo = Function | Other.LegacyFunction;';
    expect(await translate(code)).toBe(code + '\n');
  });

  test('preserves Function in the generated TypeScript API', async () => {
    const source = `export type Callbacks = {
      onPress?: ?((value?: string) => any) | ?LegacyFunction,
      listener: LegacyFunction,
    };
    export function forkEvent(event: ?LegacyFunction): LegacyFunction {
      return event;
    }`;
    const result = await translateSourceFile(source, __filename);
    const original = await translateSourceFile(
      source.replaceAll('LegacyFunction', 'Function'),
      __filename,
    );
    expect(result).toEqual(original);
  });
});
