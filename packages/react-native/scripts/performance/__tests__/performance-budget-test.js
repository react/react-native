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

const {checkPerformanceBudget} = require('../performance-budget');

describe('checkPerformanceBudget', () => {
  it('passes when report metrics are within absolute budgets', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
              p95: 2600,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 2100,
              p95: 2500,
            },
          },
        },
      ],
    );

    expect(result).toEqual({
      ok: true,
      failures: [],
      warnings: [],
    });
  });

  it('fails when report metrics exceed absolute budgets', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 2460,
            },
          },
        },
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
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
    ]);
  });

  it('passes when report metrics stay within the allowed baseline regression', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
              maxRegressionPct: 10,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1080,
            },
          },
        },
      ],
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1000,
            },
          },
        },
      ],
    );

    expect(result).toEqual({
      ok: true,
      failures: [],
      warnings: [],
    });
  });

  it('fails when report metrics exceed the allowed baseline regression', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
              maxRegressionPct: 10,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1120,
            },
          },
        },
      ],
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1000,
            },
          },
        },
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      {
        type: 'regression',
        flow: 'cold-start-home',
        metric: 'startupTimeMs',
        stat: 'p75',
        actual: 1120,
        baseline: 1000,
        regressionPct: 12,
        maxRegressionPct: 10,
        message:
          'cold-start-home startupTimeMs p75 regressed by 12.00%, exceeding allowed regression 10%',
      },
    ]);
  });

  it('fails when budgeted data is missing from reports', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
            },
          },
          'open-search-screen': {
            transitionCompleteMs: {
              p75: 500,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {},
          },
        },
      ],
    );

    expect(result).toEqual({
      ok: false,
      failures: [
        {
          type: 'missing',
          flow: 'cold-start-home',
          metric: 'startupTimeMs',
          stat: 'p75',
          message: 'cold-start-home startupTimeMs has no reported p75 value',
        },
        {
          type: 'missing',
          flow: 'open-search-screen',
          message: 'open-search-screen has no performance report',
        },
      ],
      warnings: [],
    });
  });

  it('fails when duplicate flow reports would make input ambiguous', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 2460,
            },
          },
        },
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 2100,
            },
          },
        },
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      {
        type: 'duplicate_report',
        flow: 'cold-start-home',
        reportKind: 'current',
        firstReportIndex: 0,
        duplicateReportIndex: 1,
        message:
          'current performance reports contain duplicate flow cold-start-home at indexes 0 and 1',
      },
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
    ]);
  });

  it('fails when duplicate baseline reports would make regression comparison ambiguous', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
              maxRegressionPct: 10,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1080,
            },
          },
        },
      ],
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1000,
            },
          },
        },
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 500,
            },
          },
        },
      ],
    );

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      {
        type: 'duplicate_report',
        flow: 'cold-start-home',
        reportKind: 'baseline',
        firstReportIndex: 0,
        duplicateReportIndex: 1,
        message:
          'baseline performance reports contain duplicate flow cold-start-home at indexes 0 and 1',
      },
    ]);
  });

  it('fails with structured output for invalid report shapes', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
        },
      ],
    );

    expect(result).toEqual({
      ok: false,
      failures: [
        {
          type: 'invalid_report',
          reportKind: 'current',
          reportIndex: 0,
          message: 'current performance report at index 0 must include metrics',
        },
        {
          type: 'missing',
          flow: 'cold-start-home',
          message: 'cold-start-home has no performance report',
        },
      ],
      warnings: [],
    });
  });

  it('warns when a regression budget has no matching baseline data', () => {
    const result = checkPerformanceBudget(
      {
        flows: {
          'cold-start-home': {
            startupTimeMs: {
              p75: 2200,
              maxRegressionPct: 10,
            },
          },
        },
      },
      [
        {
          flow: 'cold-start-home',
          metrics: {
            startupTimeMs: {
              p75: 1080,
            },
          },
        },
      ],
    );

    expect(result).toEqual({
      ok: true,
      failures: [],
      warnings: [
        {
          flow: 'cold-start-home',
          metric: 'startupTimeMs',
          stat: 'p75',
          message:
            'cold-start-home startupTimeMs p75 has no baseline value for regression comparison',
        },
      ],
    });
  });
});
