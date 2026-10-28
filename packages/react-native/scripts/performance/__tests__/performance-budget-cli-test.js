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

const {formatResult, parseArgs} = require('../performance-budget-cli');

describe('performance-budget-cli', () => {
  describe('parseArgs', () => {
    it('parses budget, input, and baseline paths', () => {
      expect(
        parseArgs([
          '--budget',
          'react-native.performance.json',
          '--input',
          'current-a.json',
          '--input',
          'current-b.json',
          '--baseline',
          'baseline-a.json',
        ]),
      ).toEqual({
        budget: 'react-native.performance.json',
        inputs: ['current-a.json', 'current-b.json'],
        baselines: ['baseline-a.json'],
      });
    });
  });

  describe('formatResult', () => {
    it('formats passing results with warnings', () => {
      expect(
        formatResult({
          ok: true,
          failures: [],
          warnings: [
            {
              flow: 'cold-start-home',
              message:
                'cold-start-home startupTimeMs p75 has no baseline value for regression comparison',
            },
          ],
        }),
      ).toEqual([
        'Performance budget passed',
        '',
        'Warnings:',
        '- cold-start-home startupTimeMs p75 has no baseline value for regression comparison',
      ]);
    });

    it('formats failing results', () => {
      expect(
        formatResult({
          ok: false,
          failures: [
            {
              type: 'absolute',
              flow: 'cold-start-home',
              metric: 'startupTimeMs',
              stat: 'p75',
              actual: 2460,
              budget: 2200,
              message:
                'cold-start-home startupTimeMs p75 is 2460, exceeding budget 2200',
            },
          ],
          warnings: [],
        }),
      ).toEqual([
        'Performance budget failed',
        '',
        'Failures:',
        '- cold-start-home startupTimeMs p75 is 2460, exceeding budget 2200',
      ]);
    });
  });
});
