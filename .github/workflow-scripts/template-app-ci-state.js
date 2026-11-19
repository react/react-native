/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

const {collectFlows, loadState} = require('./maestro-ios');
const {reportTestResults} = require('./report-test-results');
const fs = require('node:fs');
const path = require('node:path');

const FLAVORS = ['Debug', 'Release'];

function recordConfigurationResult({core, flavor, passed}) {
  if (!FLAVORS.includes(flavor)) {
    throw new Error(`Unknown template app configuration: ${flavor}`);
  }
  // Each matrix leg writes only its own result, so a passing leg cannot
  // overwrite the failure of another configuration.
  core.setOutput(
    `${flavor.toLowerCase()}-result`,
    passed ? 'passed' : 'failed',
  );
}

function configurationResults({flavors, previousResults, outputs}) {
  if (
    !Array.isArray(flavors) ||
    flavors.length === 0 ||
    flavors.some(flavor => !FLAVORS.includes(flavor)) ||
    new Set(flavors).size !== flavors.length
  ) {
    throw new Error(
      'Expected a non-empty array of unique Debug/Release configurations',
    );
  }

  const results = Object.fromEntries(
    FLAVORS.map(flavor => {
      const result = flavors.includes(flavor)
        ? outputs[`${flavor.toLowerCase()}-result`]
        : previousResults[flavor];
      // Missing results include runner/setup/reporting failures. They must
      // remain eligible for another attempt rather than becoming a pass.
      return [flavor, result === 'passed' ? 'passed' : 'failed'];
    }),
  );
  const failedFlavors = FLAVORS.filter(flavor => results[flavor] !== 'passed');
  return {
    results,
    failedFlavors,
    status: failedFlavors.length === 0 ? 'success' : 'failure',
  };
}

async function reportConfigurationResults({
  context,
  core,
  needs,
  job,
  flavors,
  previousResults,
  failOnError,
  attempt,
}) {
  const current = needs[job];
  const result = configurationResults({
    flavors,
    previousResults,
    outputs: current.outputs ?? {},
  });
  // A failed matrix job also needs a retry if its final result step was lost.
  // Configuration results remain authoritative for omitted successful legs.
  if (current.result !== 'success' && result.status === 'success') {
    for (const flavor of flavors) {
      result.results[flavor] = 'failed';
    }
    result.failedFlavors = FLAVORS.filter(
      flavor => result.results[flavor] !== 'passed',
    );
    result.status = 'failure';
  }
  core.setOutput('results', JSON.stringify(result.results));
  core.setOutput('failed-flavors', JSON.stringify(result.failedFlavors));
  await reportTestResults({
    context,
    core,
    needs: {
      [job]: {
        ...current,
        outputs: {...current.outputs, status: result.status},
      },
    },
    failOnError,
    attempt,
  });
}

function prepareTestState(statePath, flowPath) {
  let state;
  try {
    state = loadState(statePath);
  } catch {
    // A missing/invalid state download is recoverable: execute the flows
    // again, and replace malformed JSON before the Maestro runner reads it.
    fs.rmSync(statePath, {force: true});
    return true;
  }
  const flows = collectFlows(flowPath);
  return !(
    flows.length > 0 &&
    flows.every(flow => {
      const key = path
        .relative(process.cwd(), path.resolve(flow))
        .split(path.sep)
        .join('/');
      return state.flows[key]?.status === 'passed';
    })
  );
}

module.exports = {
  configurationResults,
  prepareTestState,
  recordConfigurationResult,
  reportConfigurationResults,
};
