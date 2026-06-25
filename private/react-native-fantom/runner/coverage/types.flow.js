/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

// Istanbul location types
type Location = {
  line: number,
  column: number,
};

type Range = {
  start: Location,
  end: Location,
};

type StatementMap = {[key: string]: Range};

type FnMap = {
  [key: string]: {
    name: string,
    decl: Range,
    loc: Range,
    line: number,
  },
};

type BranchMap = {
  [key: string]: {
    type: string,
    line: number,
    loc: Range,
    locations: Array<Range>,
  },
};

// Istanbul FileCoverage data format
export type FileCoverageData = {
  path: string,
  statementMap: StatementMap,
  fnMap: FnMap,
  branchMap: BranchMap,
  s: {[key: string]: number},
  f: {[key: string]: number},
  b: {[key: string]: Array<number | string>},
};

export type CoverageMap = {
  [key: string]: FileCoverageData,
};
