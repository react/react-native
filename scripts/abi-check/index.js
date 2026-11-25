/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {DumpOptions} from './dump';
import type {LayoutMap} from './normalize';

const {diffLayouts} = require('./diff');
const {dumpHeaders} = require('./dump');

export type AbiBreak = {
  key: string,
  change: 'changed' | 'removed',
};

export type AbiReport = {
  breaks: Array<AbiBreak>,
  additions: Array<string>,
};

/**
 * Reports the types whose layout, vtable or enumerator values changed or
 * that were removed. Added types are reported separately because they do not
 * break the ABI.
 */
function abiReport(
  baseLayouts: LayoutMap,
  currentLayouts: LayoutMap,
): AbiReport {
  const {changed, removed, added} = diffLayouts(baseLayouts, currentLayouts);
  return {
    breaks: [
      ...changed.map((key): AbiBreak => ({key, change: 'changed'})),
      ...removed.map((key): AbiBreak => ({key, change: 'removed'})),
    ],
    additions: added,
  };
}

/** Dumps both header sets and compares them with `abiReport`. */
async function compareHeaderSets(
  base: DumpOptions,
  current: DumpOptions,
): Promise<AbiReport> {
  const [baseLayouts, currentLayouts] = await Promise.all([
    dumpHeaders(base),
    dumpHeaders(current),
  ]);
  return abiReport(baseLayouts, currentLayouts);
}

module.exports = {abiReport, compareHeaderSets};
