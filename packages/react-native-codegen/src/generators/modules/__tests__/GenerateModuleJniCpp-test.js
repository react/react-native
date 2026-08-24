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
const generator = require('../GenerateModuleJniCpp.js');

describe('GenerateModuleJniCpp', () => {
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

  it('generates a JNI ArrayBuffer array signature for a top-level Array<ArrayBuffer> parameter', () => {
    const output = generator.generate(
      'array_buffer_native_module',
      fixtures.array_buffer_native_module,
      'com.facebook.fbreact.specs',
    );
    expect([...output.values()].join('\n')).toContain(
      '[Lcom/facebook/react/bridge/ArrayBuffer;',
    );
  });
});
