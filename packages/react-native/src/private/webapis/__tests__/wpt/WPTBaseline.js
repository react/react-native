/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {WPTSuiteResult} from './WPTTestHarness';

export type WPTBaseline = {
  fetch: WPTSuiteResult,
  streams: WPTSuiteResult,
};

// $FlowExpectedError[untyped-import] JSON cannot carry a Flow declaration.
const baseline = require('./wpt-baseline.json') as WPTBaseline;

export default baseline;
