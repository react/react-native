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

// $FlowFixMe[cannot-resolve-module]
const flowSnaps = require('../../../../src/parsers/flow/modules/__tests__/__snapshots__/module-parser-snapshot-test.js.snap');
// $FlowFixMe[cannot-resolve-module]
const tsSnaps = require('../../../../src/parsers/typescript/modules/__tests__/__snapshots__/typescript-module-parser-snapshot-test.js.snap');
const flowFixtures = require('../../flow/modules/__test_fixtures__/fixtures.js');
const tsFixtures = require('../../typescript/modules/__test_fixtures__/fixtures.js');
const {compareSnaps, compareTsArraySnaps} = require('../compareSnaps.js');

const flowExtraCases = [
  'NATIVE_MODULE_WITH_OPAQUE_TYPES',
  'PROMISE_WITH_COMMONLY_USED_TYPES',
];
const tsExtraCases = [
  'NATIVE_MODULE_WITH_ARRAY2_WITH_ALIAS',
  'NATIVE_MODULE_WITH_ARRAY2_WITH_UNION_AND_TOUPLE',
  'NATIVE_MODULE_WITH_BASIC_ARRAY2',
  'NATIVE_MODULE_WITH_COMPLEX_ARRAY2',
  'NATIVE_MODULE_WITH_INTERSECTION_TYPES',
  'NATIVE_MODULE_WITH_NESTED_INTERFACES',
  'NATIVE_MODULE_WITH_RECORD',
];
const ignoredCases /*: Array<string> */ = [];

compareSnaps(
  flowFixtures,
  flowSnaps,
  flowExtraCases,
  tsFixtures,
  tsSnaps,
  tsExtraCases,
  ignoredCases,
);
compareTsArraySnaps(tsSnaps, tsExtraCases);
