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
const generator = require('../GenerateModuleObjCpp');

describe('GenerateModuleHObjCpp', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      const fixture = fixtures[fixtureName];

      it(`can generate fixture ${fixtureName}`, () => {
        const output = generator.generate(
          fixtureName,
          fixture,
          'com.facebook.fbreact.specs',
          false,
        );
        expect(
          new Map([[`${fixtureName}.h`, output.get(`${fixtureName}.h`)]]),
        ).toMatchSnapshot();
      });
    });
});
