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

const injectDebuggerStatementsInTests = require('../babel-plugins/inject-debugger-statements-in-tests');
const {getFantomTestName} = require('../fantomTestFiles');
const fantomJestConfig = require('../jest.config');
const {transformSync} = require('@babel/core');
const path = require('node:path');

const FANTOM_TEST_PATHS = [
  'Libraries/Components/View/__tests__/View-itest.js',
  'Libraries/Components/View/__tests__/View-itest.fb.js',
  'my-library/__tests__/Example-itest.ts',
  'my-library/__tests__/Example-itest.tsx',
  'my-library/__tests__/Example-itest.fb.ts',
  'my-library/__tests__/Example-itest.fb.tsx',
];

const GENERATED_ENTRYPOINT_PATH =
  'private/react-native-fantom/.out/js-builds/run-1/1700000000000-View-itest.js';

const OTHER_PATHS = [
  'Libraries/Components/View/__tests__/View-test.js',
  'my-library/__tests__/Example-itest.jsx',
  'my-library/__tests__/Example-itest.d.ts',
  'Libraries/Components/View/View-itest.js',
  GENERATED_ENTRYPOINT_PATH,
];

const testRegex = new RegExp(fantomJestConfig.testRegex);

function isRunByJest(testPath: string): boolean {
  return (
    fantomJestConfig.moduleFileExtensions.includes(
      path.extname(testPath).slice(1),
    ) && testRegex.test(testPath)
  );
}

function onWindows(testPath: string): string {
  return `C:\\repository\\${testPath.replaceAll('/', '\\')}`;
}

function transformTestFile(filename: string, code: string): ?string {
  return transformSync(code, {
    babelrc: false,
    configFile: false,
    filename,
    plugins: [injectDebuggerStatementsInTests],
  })?.code;
}

describe('Fantom test files', () => {
  it.each(FANTOM_TEST_PATHS)('Jest runs %s', testPath => {
    expect(isRunByJest(`/repository/${testPath}`)).toBe(true);
  });

  it.each(OTHER_PATHS)('Jest skips %s', testPath => {
    expect(isRunByJest(`/repository/${testPath}`)).toBe(false);
  });

  it.each(FANTOM_TEST_PATHS)(
    'starts %s with a debugger statement, once',
    testPath => {
      const transformed = transformTestFile(
        `/repository/${testPath}`,
        'run();',
      );

      expect(transformed).toBe('debugger;\nrun();');
      expect(
        transformTestFile(`/repository/${testPath}`, transformed ?? ''),
      ).toBe(transformed);
    },
  );

  it.each(OTHER_PATHS)('leaves %s without a debugger statement', testPath => {
    expect(transformTestFile(`/repository/${testPath}`, 'run();')).toBe(
      'run();',
    );
  });

  it.each(FANTOM_TEST_PATHS)(
    'starts %s with a debugger statement on a Windows path',
    testPath => {
      expect(transformTestFile(onWindows(testPath), 'run();')).toBe(
        'debugger;\nrun();',
      );
    },
  );

  it.each(OTHER_PATHS)(
    'leaves %s without a debugger statement on a Windows path',
    testPath => {
      expect(transformTestFile(onWindows(testPath), 'run();')).toBe('run();');
    },
  );

  it.each([
    `/home/__tests__/react-native/${GENERATED_ENTRYPOINT_PATH}`,
    `C:\\__tests__\\react-native\\${GENERATED_ENTRYPOINT_PATH.replaceAll('/', '\\')}`,
  ])(
    'leaves the generated entrypoint %s of a checkout in a __tests__ folder without a debugger statement',
    filename => {
      expect(transformTestFile(filename, 'run();')).toBe('run();');
    },
  );

  it.each([
    ['Libraries/Components/View/__tests__/View-itest.js', 'View'],
    ['my-library/__tests__/Example-itest.ts', 'Example'],
    ['my-library/__tests__/Example-itest.tsx', 'Example'],
    [
      'Libraries/Components/View/__tests__/View-itest.fb.js',
      'View-itest.fb.js',
    ],
    ['my-library/__tests__/Example-itest.fb.tsx', 'Example-itest.fb.tsx'],
  ])('names %s as %s in titles', (testPath, name) => {
    expect(getFantomTestName(`/repository/${testPath}`)).toBe(name);
  });
});
