/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const {FlowParser} = require('../../../parsers/flow/parser');
const {TypeScriptParser} = require('../../../parsers/typescript/parser');
const {combineSchemas} = require('../combine-js-to-schema');
const fs = require('node:fs');

jest.mock('node:fs', () => ({
  ...jest.requireActual('node:fs'),
  readFileSync: jest.fn(),
}));

const readFileSync = jest.spyOn(fs, 'readFileSync');

describe.each([
  ['Flow', 'js', new FlowParser()],
  ['TypeScript', 'ts', new TypeScriptParser()],
  ['TypeScript (.tsx)', 'tsx', new TypeScriptParser()],
])('combineSchemas with %s', (language, extension, parser) => {
  const filename = `SampleNativeComponent.${extension}`;
  const componentSource = `
    import type {ViewProps} from 'react-native';
    import codegenNativeComponent from 'react-native/Libraries/Utilities/codegenNativeComponent';
    ${
      language === 'Flow'
        ? 'type NativeProps = $ReadOnly<{...ViewProps}>;'
        : 'interface NativeProps extends ViewProps {}'
    }
    export default codegenNativeComponent<NativeProps>('Sample');
  `;
  const moduleFilename = `NativeSample.${extension}`;
  const moduleSource = `
    import type {TurboModule} from 'react-native';
    import {TurboModuleRegistry} from 'react-native';
    export interface Spec extends TurboModule {}
    export default TurboModuleRegistry.getEnforcing<Spec>('Sample');
  `;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    'codegenNativeComponent<',
    'codegenNativeComponent <',
    'codegenNativeComponent\n<',
    'codegenNativeComponent /* comment */ <',
    'codegenNativeComponent // comment\n<',
    'codegenNativeComponent // comment\r\n<',
    'codegenNativeComponent // comment\u2028<',
    'codegenNativeComponent // comment\u2029<',
  ])('combines components using %s', call => {
    readFileSync.mockReturnValue(
      componentSource.replace('codegenNativeComponent<', call),
    );

    const schema = parser.parseString(componentSource, filename);
    expect(Object.keys(schema.modules)).toHaveLength(1);
    expect(combineSchemas([filename], 'SampleLibrary')).toEqual({
      libraryName: 'SampleLibrary',
      modules: schema.modules,
    });
  });

  it.each([
    'export default (\n',
    'export default(\n',
    'export /* comment */ default (\n',
    'export default ((\n',
  ])('combines components with %s', declaration => {
    readFileSync.mockReturnValue(
      componentSource.replace(
        "export default codegenNativeComponent<NativeProps>('Sample');",
        `${declaration}
          codegenNativeComponent<NativeProps>('Sample')
        ${declaration.includes('((') ? '))' : ')'};`,
      ),
    );

    expect(combineSchemas([filename]).modules).toEqual(
      parser.parseString(componentSource, filename).modules,
    );
  });

  it.each([
    'extends TurboModule',
    'extends  TurboModule',
    'extends\tTurboModule',
    'extends\nTurboModule',
    'extends /* comment */ TurboModule',
    'extends // comment\nTurboModule',
    'extends // comment\r\nTurboModule',
    'extends // comment\u2028TurboModule',
    'extends // comment\u2029TurboModule',
  ])('combines modules using %s', declaration => {
    readFileSync.mockReturnValue(
      moduleSource.replace('extends TurboModule', declaration),
    );

    const schema = parser.parseString(moduleSource, moduleFilename);
    expect(Object.keys(schema.modules)).toHaveLength(1);
    expect(combineSchemas([moduleFilename]).modules).toEqual(schema.modules);
  });

  it.each([
    '',
    'not valid JavaScript',
    "export default 'codegenNativeComponent';",
    "export default 'TurboModule';",
    '/* codegenNativeComponent */',
    '/* TurboModule */',
    "import {TurboModuleRegistry} from 'react-native'; export default TurboModuleRegistry.get('Sample');",
    'export default // codegenNativeComponent<NativeProps>("Sample");',
    'interface Other extends // TurboModule {}',
    'export default /* first */ undefined; /* second */ codegenNativeComponent<NativeProps>("Sample");',
    'interface Other extends /* first */ Base {} /* second */ TurboModule;',
  ])('ignores non-spec contents: %s', contents => {
    readFileSync.mockReturnValue(contents);

    expect(combineSchemas([filename])).toEqual({libraryName: '', modules: {}});
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  it('ignores JSX files that only mention codegen identifiers in comments', () => {
    readFileSync.mockReturnValue(
      `/* codegenNativeComponent TurboModule */
      export default () => <View />;`,
    );

    expect(combineSchemas(['SampleNativeComponent.tsx'])).toEqual({
      libraryName: '',
      modules: {},
    });
    expect(readFileSync).toHaveBeenCalledTimes(1);
  });

  it('reports parser errors in formatted component specs', () => {
    readFileSync.mockReturnValue(
      componentSource.replace(
        "codegenNativeComponent<NativeProps>('Sample')",
        "codegenNativeComponent /* comment */ <MissingProps>('Sample')",
      ),
    );

    expect(() => combineSchemas([filename])).toThrow();
  });
});
