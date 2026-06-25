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

function compareSnaps(
  flowFixtures /*: Readonly<{[string]: string}> */,
  flowSnaps /*: Readonly<{[string]: string}> */,
  flowExtraCases /*: ReadonlyArray<string> */,
  tsFixtures /*: Readonly<{[string]: string}> */,
  tsSnaps /*: Readonly<{[string]: string}> */,
  tsExtraCases /*: ReadonlyArray<string> */,
  ignoredCases /*: ReadonlyArray<string> */,
) {
  const flowCases = Object.keys(flowFixtures).sort();
  const tsCases = Object.keys(tsFixtures).sort();
  const commonCases = flowCases.filter(name => tsCases.indexOf(name) !== -1);

  describe('RN Codegen Parsers', () => {
    it('should not unintentionally contains test case for Flow but not for TypeScript', () => {
      expect(
        flowCases.filter(name => commonCases.indexOf(name) === -1),
      ).toEqual(flowExtraCases);
    });

    it('should not unintentionally contains test case for TypeScript but not for Flow', () => {
      expect(tsCases.filter(name => commonCases.indexOf(name) === -1)).toEqual(
        tsExtraCases,
      );
    });

    for (const commonCase of commonCases) {
      const flowSnap =
        flowSnaps[
          `RN Codegen Flow Parser can generate fixture ${commonCase} 1`
        ];
      const tsSnap =
        tsSnaps[
          `RN Codegen TypeScript Parser can generate fixture ${commonCase} 1`
        ];

      it(`should be able to find the snapshot for Flow for case ${commonCase}`, () => {
        expect(typeof flowSnap).toEqual('string');
      });

      it(`should be able to find the snapshot for TypeScript for case ${commonCase}`, () => {
        expect(typeof tsSnap).toEqual('string');
      });

      if (ignoredCases.indexOf(commonCase) === -1) {
        it(`should generate the same snapshot from Flow and TypeScript for fixture ${commonCase}`, () => {
          expect(flowSnap).toEqual(tsSnap);
        });
      } else {
        it(`should generate the different snapshot from Flow and TypeScript for fixture ${commonCase}`, () => {
          expect(flowSnap).not.toEqual(tsSnap);
        });
      }
    }
  });
}

function compareTsArraySnaps(
  tsSnaps /*: Readonly<{[string]: string}> */,
  tsExtraCases /*: ReadonlyArray<string> */,
) {
  for (const array2Case of tsExtraCases.filter(
    name => name.indexOf('ARRAY2') !== -1,
  )) {
    const arrayCase = array2Case.replace('ARRAY2', 'ARRAY');
    it(`should generate the same snap from fixture ${arrayCase} and ${array2Case}`, () => {
      expect(
        tsSnaps[
          `RN Codegen TypeScript Parser can generate fixture ${arrayCase}`
        ],
      ).toEqual(
        tsSnaps[
          `RN Codegen TypeScript Parser can generate fixture ${array2Case}`
        ],
      );
    });
  }
}

module.exports = {
  compareSnaps,
  compareTsArraySnaps,
};
