/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BASELINE_MARKER = '__RN_WPT_BASELINE__';
const ANSI_COLOR_SEQUENCE = new RegExp(
  `${String.fromCharCode(27)}\\[[0-9;]*m`,
  'g',
);
const REPO_ROOT = path.resolve(__dirname, '../..');
const BASELINE_PATH = path.join(
  REPO_ROOT,
  'packages/react-native/src/private/webapis/__tests__/wpt/wpt-baseline.json',
);
const CAPTURE_TEST_PATH = path.join(
  REPO_ROOT,
  'packages/react-native/src/private/webapis/__tests__/wpt/WPTBaselineCapture.js',
);
const CAPTURE_TEST_REGEX = `^${CAPTURE_TEST_PATH.replace(
  /[.*+?^${}()|[\]\\]/g,
  '\\$&',
)}$`;

function parseSuiteBaseline(output, suite) {
  const marker = `${BASELINE_MARKER}${suite}:`;
  const markerLine = output.split('\n').find(line => line.includes(marker));

  if (markerLine == null) {
    process.stderr.write(output);
    throw new Error(`Could not capture the ${suite} WPT baseline.`);
  }

  const payload = markerLine
    .slice(markerLine.indexOf(marker) + marker.length)
    .replace(ANSI_COLOR_SEQUENCE, '')
    .trim();
  return JSON.parse(payload);
}

function captureBaseline() {
  const result = spawnSync(
    'yarn',
    ['fantom', '--testRegex', CAPTURE_TEST_REGEX, '--runInBand'],
    {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      env: {...process.env, FANTOM_PRINT_OUTPUT: '1'},
      maxBuffer: 50 * 1024 * 1024,
    },
  );
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.error != null) {
    throw result.error;
  }
  if (result.status !== 0) {
    const diagnostics = output
      .split('\n')
      .filter(line => !line.includes(BASELINE_MARKER))
      .join('\n')
      .trim();
    if (diagnostics !== '') {
      process.stderr.write(`${diagnostics}\n`);
    }
    throw new Error(
      `WPT baseline capture exited with status ${String(result.status)}.`,
    );
  }
  return {
    fetch: parseSuiteBaseline(output, 'fetch'),
    streams: parseSuiteBaseline(output, 'streams'),
  };
}

function formatSuiteSummary(suite, baseline) {
  const summary = baseline.summary;
  const counts = [
    `${summary.PASS} pass`,
    `${summary.FLAKY} flaky`,
    `${summary.FAIL} fail`,
    `${summary.TIMEOUT} timeout`,
    `${summary.noOpTests} no-op excluded`,
  ].join(', ');
  return baseline.blocked == null
    ? `Recorded ${suite}: ${counts}.`
    : `Recorded ${suite}: BLOCKED, ${baseline.blocked.reason}, ${baseline.blocked.gatedTests} subtests gated; ${counts}.`;
}

function main() {
  const baseline = captureBaseline();
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`);

  console.log(formatSuiteSummary('fetch', baseline.fetch));
  console.log(formatSuiteSummary('streams', baseline.streams));

  const verification = spawnSync('yarn', ['test-wpt'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (verification.error != null) {
    throw verification.error;
  }
  if (verification.status !== 0) {
    process.exitCode = verification.status ?? 1;
  }
}

main();
