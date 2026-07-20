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

const generator = require('../../../../src/generators/components/GenerateEventEmitterCpp');
const {FlowParser} = require('../../../../src/parsers/flow/parser');
const fs = require('node:fs');

const FIXTURE_DIR = `${__dirname}/../../__test_fixtures__/components`;

const fixtures = fs.readdirSync(FIXTURE_DIR);

const parser = new FlowParser();

fixtures.forEach(fixture => {
  it(`GenerateEventEmitterCpp can generate for '${fixture}' using types under single namespace`, () => {
    const libName = 'RNCodegenModuleFixtures';
    const schema = parser.parseFile(`${FIXTURE_DIR}/${fixture}`);
    const output = generator.generate(
      libName,
      schema,
      undefined,
      false,
      `react/renderer/components/${libName}/`,
    );
    expect(Object.fromEntries(output)).toMatchSnapshot();
  });
});
