#!/usr/bin/env node
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
import type {Stats} from 'fs';
*/

const {checkPerformanceBudget} = require('./performance-budget');
const fs = require('fs');

/*::
type ParsedArgs = $ReadOnly<{
  +budget: string,
  +inputs: $ReadOnlyArray<string>,
  +baselines: $ReadOnlyArray<string>,
}>;

type Message = $ReadOnly<{
  +message: string,
  ...,
}>;

type FormattableResult = $ReadOnly<{
  +ok: boolean,
  +failures: $ReadOnlyArray<Message>,
  +warnings: $ReadOnlyArray<Message>,
}>;
*/

function readJsonFile(path /*: string */) /*: mixed */ {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function expandReportInput(path /*: string */) /*: $ReadOnlyArray<mixed> */ {
  const stat /*: Stats */ = fs.statSync(path);
  if (stat.isDirectory()) {
    return fs
      .readdirSync(path)
      .filter(file => file.endsWith('.json'))
      .sort()
      .map(file => readJsonFile(`${path}/${file}`));
  }
  return [readJsonFile(path)];
}

function readReports(
  paths /*: $ReadOnlyArray<string> */,
) /*: $ReadOnlyArray<mixed> */ {
  return paths.flatMap(path => expandReportInput(path));
}

function parseArgs(argv /*: $ReadOnlyArray<string> */) /*: ParsedArgs */ {
  let budget = '';
  const inputs = [];
  const baselines = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];
    if (arg === '--budget') {
      budget = value;
      i += 1;
    } else if (arg === '--input') {
      inputs.push(value);
      i += 1;
    } else if (arg === '--baseline') {
      baselines.push(value);
      i += 1;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  if (budget === '') {
    throw new Error('Missing required --budget path');
  }
  if (inputs.length === 0) {
    throw new Error('Missing required --input path');
  }

  return {budget, inputs, baselines};
}

function formatResult(result /*: FormattableResult */) /*: Array<string> */ {
  const lines = [
    result.ok ? 'Performance budget passed' : 'Performance budget failed',
  ];

  if (result.failures.length > 0) {
    lines.push('', 'Failures:');
    for (const failure of result.failures) {
      lines.push(`- ${failure.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push('', 'Warnings:');
    for (const warning of result.warnings) {
      lines.push(`- ${warning.message}`);
    }
  }

  return lines;
}

function main(argv /*: $ReadOnlyArray<string> */ = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const budget = readJsonFile(args.budget);
  const reports = readReports(args.inputs);
  const baselineReports = readReports(args.baselines);
  // $FlowFixMe[incompatible-type] JSON is validated structurally by the checker.
  const result = checkPerformanceBudget(budget, reports, baselineReports);

  for (const line of formatResult(result)) {
    console.log(line);
  }

  process.exitCode = result.ok ? 0 : 1;
}

if (require.main === module) {
  main();
}

module.exports = {
  formatResult,
  main,
  parseArgs,
  readReports,
};
