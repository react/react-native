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

import type {SchemaType} from '../../../CodegenSchema';

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

  it('throws for a method returning Promise<ArrayBuffer> (unsupported on Android)', () => {
    const schema: SchemaType = {
      modules: {
        NativeSampleTurboModule: {
          type: 'NativeModule',
          aliasMap: {},
          enumMap: {},
          spec: {
            eventEmitters: [],
            methods: [
              {
                name: 'getAsyncBuffer',
                optional: false,
                typeAnnotation: {
                  type: 'FunctionTypeAnnotation',
                  returnTypeAnnotation: {
                    type: 'PromiseTypeAnnotation',
                    elementType: {type: 'ArrayBufferTypeAnnotation'},
                  },
                  params: [],
                },
              },
            ],
          },
          moduleName: 'SampleTurboModule',
        },
      },
    };
    expect(() =>
      generator.generate('array_buffer_promise_throws', schema),
    ).toThrow(/Promise<ArrayBuffer> is not supported/);
  });
});
