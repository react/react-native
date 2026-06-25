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

import loadLLVMCoverage from '../__test_utils__/loadLLVMCoverage';
import convertLLVMCoverage from '../convertLLVMCoverage';
// $FlowExpectedError[untyped-import]
import {createFileCoverage} from 'istanbul-lib-coverage';

(
  [
    'AppSettings.cpp',
    'Class.h',
    'DevSettingsModule.h',
    'NativeFantom.h',
    'NativeFantom.cpp',
    'RawPropsKey.cpp',
  ] as const
).forEach(filename => {
  describe(`FantomCoverage ${filename}`, () => {
    const {file, functions, lcov} = loadLLVMCoverage(filename);
    const fileCoverage = createFileCoverage(
      convertLLVMCoverage(file, functions),
    );

    // Parse expected DA lines from reference LCOV
    const expectedDALines: Map<number, number> = new Map();
    for (const line of lcov) {
      const match = line.match(/^DA:(\d+),(\d+)$/);
      if (match) {
        expectedDALines.set(Number(match[1]), Number(match[2]));
      }
    }

    // Parse expected FNDA lines from reference LCOV
    const expectedFNDA: Map<string, number> = new Map();
    for (const line of lcov) {
      const match = line.match(/^FNDA:(\d+),(.+)$/);
      if (match) {
        expectedFNDA.set(match[2], Number(match[1]));
      }
    }

    it('correctly converts line coverage', () => {
      const lineCoverage = fileCoverage.getLineCoverage();

      // Every line in the expected LCOV should be present with correct count
      for (const [line, expectedCount] of expectedDALines) {
        expect({line, count: lineCoverage[line]}).toEqual({
          line,
          count: expectedCount,
        });
      }

      // No extra lines should be present
      const actualLines = Object.keys(lineCoverage).map(Number);
      const expectedLines = [...expectedDALines.keys()];
      expect(actualLines.sort((a, b) => a - b)).toEqual(
        expectedLines.sort((a, b) => a - b),
      );
    });

    it('correctly converts branches', () => {
      expect(fileCoverage.toSummary().branches.total).toBe(
        file.summary.branches.count,
      );
      // Istanbul returns 100% when total is 0, LLVM returns 0%
      if (file.summary.branches.count === 0) {
        expect(fileCoverage.toSummary().branches.pct).toBe(100);
      } else {
        // Allow small precision differences due to truncation
        expect(fileCoverage.toSummary().branches.pct).toBeCloseTo(
          file.summary.branches.percent,
          1,
        );
      }
    });

    it('correctly converts functions', () => {
      expect(fileCoverage.toSummary().functions.total).toBe(
        file.summary.functions.count,
      );

      expect(fileCoverage.toSummary().functions.covered).toBe(
        file.summary.functions.covered,
      );
    });

    it('correctly converts function execution counts', () => {
      const json = fileCoverage.toJSON();

      for (const key of Object.keys(json.fnMap)) {
        const fnName = json.fnMap[key].name;
        const actualCount = json.f[key];
        const expectedCount = expectedFNDA.get(fnName);

        if (expectedCount != null) {
          expect({name: fnName, count: actualCount}).toEqual({
            name: fnName,
            count: expectedCount,
          });
        }
      }
    });
  });
});
