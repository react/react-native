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

const failureFixtures = require('../__test_fixtures__/failures.js');
const fixtures = require('../__test_fixtures__/fixtures.js');
const {FlowParser} = require('../../parser');

const flowParser = new FlowParser();

jest.mock('node:fs', () => ({
  readFileSync: filename => {
    // Jest in the OSS does not allow to capture variables in closures.
    // Therefore, we have to bring the variables inside the closure.
    // see: https://github.com/facebook/jest/issues/2567
    const readFileFixtures = require('../__test_fixtures__/fixtures.js');
    const readFileFailureFixtures = require('../__test_fixtures__/failures.js');
    return readFileFixtures[filename] || readFileFailureFixtures[filename];
  },
}));

describe('RN Codegen Flow Parser', () => {
  Object.keys(fixtures)
    .sort()
    .forEach(fixtureName => {
      it(`can generate fixture ${fixtureName}`, () => {
        const schema = flowParser.parseModuleFixture(fixtureName);
        const serializedSchema = JSON.stringify(schema, null, 2).replace(
          /"/g,
          "'",
        );

        expect(serializedSchema).toMatchSnapshot();
      });
    });

  Object.keys(failureFixtures)
    .sort()
    .forEach(fixtureName => {
      it(`Fails with error message ${fixtureName}`, () => {
        expect(() => {
          flowParser.parseModuleFixture(fixtureName);
        }).toThrowErrorMatchingSnapshot();
      });
    });
});
