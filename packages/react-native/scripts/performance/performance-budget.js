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

/*::
type MetricStats = $ReadOnly<{
  +[stat: string]: number,
}>;

type FlowMetrics = $ReadOnly<{
  +[metric: string]: MetricStats,
}>;

type BudgetMetric = $ReadOnly<{
  +[stat: string]: number,
  +maxRegressionPct?: number,
}>;

type BudgetFlow = $ReadOnly<{
  +[metric: string]: BudgetMetric,
}>;

type PerformanceBudget = $ReadOnly<{
  +flows: $ReadOnly<{
    +[flow: string]: BudgetFlow,
  }>,
}>;

type PerformanceReport = $ReadOnly<{
  +flow: string,
  +metrics: FlowMetrics,
}>;

type AbsoluteFailure = $ReadOnly<{
  +type: 'absolute',
  +flow: string,
  +metric: string,
  +stat: string,
  +actual: number,
  +budget: number,
  +message: string,
}>;

type RegressionFailure = $ReadOnly<{
  +type: 'regression',
  +flow: string,
  +metric: string,
  +stat: string,
  +actual: number,
  +baseline: number,
  +regressionPct: number,
  +maxRegressionPct: number,
  +message: string,
}>;

type MissingFailure = $ReadOnly<{
  +type: 'missing',
  +flow: string,
  +metric?: string,
  +stat?: string,
  +message: string,
}>;

type ReportKind = 'current' | 'baseline';

type InvalidReportFailure = $ReadOnly<{
  +type: 'invalid_report',
  +reportKind: ReportKind,
  +reportIndex: number,
  +message: string,
}>;

type DuplicateReportFailure = $ReadOnly<{
  +type: 'duplicate_report',
  +reportKind: ReportKind,
  +flow: string,
  +firstReportIndex: number,
  +duplicateReportIndex: number,
  +message: string,
}>;

type Failure =
  | AbsoluteFailure
  | RegressionFailure
  | MissingFailure
  | InvalidReportFailure
  | DuplicateReportFailure;

type Warning = $ReadOnly<{
  +flow: string,
  +metric?: string,
  +stat?: string,
  +message: string,
}>;

type BudgetResult = $ReadOnly<{
  +ok: boolean,
  +failures: $ReadOnlyArray<Failure>,
  +warnings: $ReadOnlyArray<Warning>,
}>;
*/

function isObject(value /*: mixed */) /*: boolean */ {
  return typeof value === 'object' && value != null && !Array.isArray(value);
}

function reportByFlow(
  reports /*: $ReadOnlyArray<mixed> */,
  reportKind /*: ReportKind */,
  failures /*: Array<Failure> */,
) /*: Map<string, PerformanceReport> */ {
  const byFlow = new Map /*:: <string, PerformanceReport> */();
  const reportIndexes = new Map /*:: <string, number> */();

  reports.forEach((reportValue, reportIndex) => {
    if (!isObject(reportValue)) {
      failures.push({
        type: 'invalid_report',
        reportKind,
        reportIndex,
        message: `${reportKind} performance report at index ${reportIndex} must be an object`,
      });
      return;
    }

    // $FlowFixMe[incompatible-type] Runtime validation above confirms this is an object.
    const report /*: {[string]: mixed} */ = reportValue;
    const flow = report.flow;
    if (typeof flow !== 'string' || flow === '') {
      failures.push({
        type: 'invalid_report',
        reportKind,
        reportIndex,
        message: `${reportKind} performance report at index ${reportIndex} must include flow`,
      });
      return;
    }

    const metrics = report.metrics;
    if (!isObject(metrics)) {
      failures.push({
        type: 'invalid_report',
        reportKind,
        reportIndex,
        message: `${reportKind} performance report at index ${reportIndex} must include metrics`,
      });
      return;
    }

    const firstReportIndex = reportIndexes.get(flow);
    if (firstReportIndex != null) {
      failures.push({
        type: 'duplicate_report',
        reportKind,
        flow,
        firstReportIndex,
        duplicateReportIndex: reportIndex,
        message: `${reportKind} performance reports contain duplicate flow ${flow} at indexes ${firstReportIndex} and ${reportIndex}`,
      });
      return;
    }

    // $FlowFixMe[incompatible-type] Runtime validation confirms the report contract used below.
    const validatedReport /*: PerformanceReport */ = {flow, metrics};
    reportIndexes.set(flow, reportIndex);
    byFlow.set(flow, validatedReport);
  });

  return byFlow;
}

function checkPerformanceBudget(
  budget /*: PerformanceBudget */,
  reports /*: $ReadOnlyArray<mixed> */,
  baselineReports /*: $ReadOnlyArray<mixed> */ = [],
) /*: BudgetResult */ {
  const failures /*: Array<Failure> */ = [];
  const warnings /*: Array<Warning> */ = [];
  const reportsByFlow = reportByFlow(reports, 'current', failures);
  const baselinesByFlow = reportByFlow(baselineReports, 'baseline', failures);

  for (const flow of Object.keys(budget.flows)) {
    const report = reportsByFlow.get(flow);
    if (report == null) {
      failures.push({
        type: 'missing',
        flow,
        message: `${flow} has no performance report`,
      });
      continue;
    }

    const budgetedMetrics = budget.flows[flow];
    for (const metric of Object.keys(budgetedMetrics)) {
      const metricStats = report.metrics[metric];
      if (metricStats == null) {
        failures.push({
          type: 'missing',
          flow,
          metric,
          message: `${flow} ${metric} has no reported metrics`,
        });
        continue;
      }

      const budgetedStats = budgetedMetrics[metric];
      for (const stat of Object.keys(budgetedStats)) {
        if (stat === 'maxRegressionPct') {
          continue;
        }

        const budgetValue = budgetedStats[stat];
        const actual = metricStats[stat];
        if (actual == null) {
          failures.push({
            type: 'missing',
            flow,
            metric,
            stat,
            message: `${flow} ${metric} has no reported ${stat} value`,
          });
          continue;
        }

        if (actual > budgetValue) {
          failures.push({
            type: 'absolute',
            flow,
            metric,
            stat,
            actual,
            budget: budgetValue,
            message: `${flow} ${metric} ${stat} is ${actual}, exceeding budget ${budgetValue}`,
          });
        }

        const maxRegressionPct = budgetedStats.maxRegressionPct;
        if (maxRegressionPct != null) {
          const baseline = baselinesByFlow.get(flow)?.metrics[metric]?.[stat];
          if (baseline == null || baseline <= 0) {
            warnings.push({
              flow,
              metric,
              stat,
              message: `${flow} ${metric} ${stat} has no baseline value for regression comparison`,
            });
            continue;
          }

          const regressionPct = ((actual - baseline) / baseline) * 100;
          if (regressionPct > maxRegressionPct) {
            failures.push({
              type: 'regression',
              flow,
              metric,
              stat,
              actual,
              baseline,
              regressionPct,
              maxRegressionPct,
              message: `${flow} ${metric} ${stat} regressed by ${regressionPct.toFixed(
                2,
              )}%, exceeding allowed regression ${maxRegressionPct}%`,
            });
          }
        }
      }
    }
  }

  return {
    ok: failures.length === 0,
    failures,
    warnings,
  };
}

module.exports = {
  checkPerformanceBudget,
};
