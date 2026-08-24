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

const fixtures = require('../__test_fixtures__/fixtures.js');
const generator = require('../GenerateModuleJavaSpec.js');

describe('GenerateModuleJavaSpec', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        expect(
          generator.generate(
            fixtureName,
            fixture,
            'com.facebook.fbreact.specs',
          ),
        ).toMatchSnapshot();
      });
    });

  it('generates ArrayBuffer[] for a top-level Array<ArrayBuffer> parameter', () => {
    const output = generator.generate(
      'array_buffer_native_module',
      fixtures.array_buffer_native_module,
      'com.facebook.fbreact.specs',
    );
    expect([...output.values()].join('\n')).toContain('ArrayBuffer[] values');
  });

  it('does not generate ArrayBuffer[] when array element type is nullable', () => {
    const schema: $FlowFixMe = {
      modules: {
        NativeSampleTurboModule: {
          type: 'NativeModule',
          aliasMap: {},
          enumMap: {},
          moduleName: 'SampleTurboModule',
          spec: {
            eventEmitters: [],
            methods: [
              {
                name: 'nullableElements',
                optional: false,
                typeAnnotation: {
                  type: 'FunctionTypeAnnotation',
                  returnTypeAnnotation: {type: 'NumberTypeAnnotation'},
                  params: [
                    {
                      name: 'values',
                      optional: false,
                      typeAnnotation: {
                        type: 'ArrayTypeAnnotation',
                        elementType: {
                          type: 'NullableTypeAnnotation',
                          typeAnnotation: {type: 'ArrayBufferTypeAnnotation'},
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    };
    const output = generator.generate(
      'nullable_array_buffer_elements',
      schema,
      'com.facebook.fbreact.specs',
    );
    const contents = [...output.values()].join('\n');
    expect(contents).toContain('nullableElements(ReadableArray values)');
    expect(contents).not.toMatch(/nullableElements\(ArrayBuffer\[\] values\)/);
  });
});
