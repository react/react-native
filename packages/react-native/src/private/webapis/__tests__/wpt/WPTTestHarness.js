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

import * as Fantom from '@react-native/fantom';

type WPTSourceFile = {
  path: string,
  source: string,
};

type WPTTestFixture = WPTSourceFile & {
  dependencies: ReadonlyArray<WPTSourceFile>,
  manifest: {
    globals: ReadonlyArray<string>,
    type: string,
    urls: ReadonlyArray<string>,
  },
};

type WPTUnsupportedFile = {
  path: string,
  reason: string,
};

export type WPTFixtures = {
  manifest: {
    sha256: string,
    version: number,
  },
  revision: string,
  selection: {
    environment: string,
    manifestTypes: ReadonlyArray<string>,
    sourceFormat: string,
  },
  source: string,
  testharness: string,
  suites: {
    fetch: ReadonlyArray<WPTTestFixture>,
    streams: ReadonlyArray<WPTTestFixture>,
  },
  unsupported: {
    fetch: ReadonlyArray<WPTUnsupportedFile>,
    streams: ReadonlyArray<WPTUnsupportedFile>,
  },
};

type WPTSuiteName = keyof WPTFixtures['suites'];
type WPTExecutionOrder = 'deterministic-shuffle' | 'manifest';

type WPTTestharnessResult = {
  message: unknown,
  name: unknown,
  status: unknown,
};

type WPTTestharnessStatus = {
  status: unknown,
};

type WPTTestFunction = (
  callback: () => void,
  name: string,
  properties?: unknown,
) => void;

type WPTHarnessAPI = {
  add_completion_callback: (
    callback: (
      tests: ReadonlyArray<WPTTestharnessResult>,
      status: WPTTestharnessStatus,
    ) => void,
  ) => void,
  add_result_callback: (callback: (test: WPTTestharnessResult) => void) => void,
  done: () => void,
  setup: (options: {explicit_done: boolean, output: boolean}) => void,
  test: WPTTestFunction,
};

type WPTGlobal = WPTHarnessAPI & {
  addEventListener: () => void,
  eval: (source: string) => unknown,
  GLOBAL: {
    isDedicatedWorker: () => boolean,
    isServiceWorker: () => boolean,
    isShadowRealm: () => boolean,
    isSharedWorker: () => boolean,
    isWindow: () => boolean,
    isWorker: () => boolean,
  },
  self: WPTGlobal,
};

type WPTSubtestResult = {
  name: string,
  status: string,
};

type WPTFileResult = {
  harnessStatus: string,
  path: string,
  readonly tests: ReadonlyArray<WPTSubtestResult>,
};

type WPTBlockedSuite = {
  gatedFiles: number,
  gatedTests: number,
  missingGlobals: ReadonlyArray<string>,
  reason: string,
};

type WPTSummary = {
  BLOCKED: number,
  FAIL: number,
  FLAKY: number,
  NOTRUN: number,
  PASS: number,
  PRECONDITION_FAILED: number,
  TIMEOUT: number,
  noOpTests: number,
  total: number,
  unsupportedFiles: number,
};

export type WPTSuiteResult = {
  blocked?: WPTBlockedSuite,
  files: ReadonlyArray<WPTFileResult>,
  manifest: WPTFixtures['manifest'],
  revision: string,
  source: string,
  summary: WPTSummary,
  suite: WPTSuiteName,
};

type WPTObservedSubtestResult = {
  message: string,
  name: string,
  status: string,
};

type WPTObservedFileResult = {
  harnessStatus: string,
  noOpTests: number,
  path: string,
  readonly tests: ReadonlyArray<WPTObservedSubtestResult>,
};

const HARNESS_STATUSES = ['OK', 'ERROR', 'TIMEOUT', 'PRECONDITION_FAILED'];
const TEST_STATUSES = [
  'PASS',
  'FAIL',
  'TIMEOUT',
  'NOTRUN',
  'PRECONDITION_FAILED',
];

function statusName(statuses: ReadonlyArray<string>, status: unknown): string {
  return typeof status === 'number' && statuses[status] != null
    ? statuses[status]
    : `UNKNOWN(${String(status)})`;
}

function getWPTGlobal(): WPTGlobal {
  // $FlowExpectedError[incompatible-type] testharness.js installs these APIs dynamically.
  // $FlowExpectedError[incompatible-variance] testharness.js replaces read-only host globals.
  return globalThis;
}

function configureShellGlobals(wptGlobal: WPTGlobal): void {
  wptGlobal.addEventListener = () => {};
  wptGlobal.GLOBAL = {
    isDedicatedWorker: () => true,
    isServiceWorker: () => false,
    isShadowRealm: () => false,
    isSharedWorker: () => false,
    isWindow: () => false,
    isWorker: () => true,
  };
  wptGlobal.self = wptGlobal;
}

const EMPTY_FUNCTION_BODY =
  /^(?:\s|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*(?:\r?\n|$))*$/;
// Hermes otherwise replaces callback bodies with `[bytecode]` in toString().
const HERMES_SHOW_SOURCE_DIRECTIVE = "'show source';";

function isNoOpTestCallback(callback: () => void): boolean {
  const source = callback.toString();
  if (
    callback.length !== 0 ||
    /^\s*async\b/.test(source) ||
    /^\s*function\s*\*/.test(source)
  ) {
    return false;
  }
  const body = source.match(/\{([\s\S]*)\}\s*$/)?.[1];
  return body != null && EMPTY_FUNCTION_BODY.test(body);
}

type PendingWPTFile = {
  completion: Promise<WPTObservedFileResult>,
  timedOutResult: () => WPTObservedFileResult,
};

function normalizeTestResult(
  testResult: WPTTestharnessResult,
): WPTObservedSubtestResult {
  return {
    message: testResult.message == null ? '' : String(testResult.message),
    name: String(testResult.name)
      .replace(/\r/g, '\\r')
      .replace(/\n/g, '\\n')
      .replace(/\t/g, '\\t'),
    status: statusName(TEST_STATUSES, testResult.status),
  };
}

function beginWPTFile(
  fixtures: WPTFixtures,
  fixture: WPTTestFixture,
): PendingWPTFile {
  const completedTests: Array<WPTObservedSubtestResult> = [];
  const noOpTestResults = new WeakSet<WPTTestharnessResult>();
  let isRegisteringNoOpTest = false;
  let noOpTests = 0;
  const wptGlobal = getWPTGlobal();
  configureShellGlobals(wptGlobal);
  wptGlobal.eval(fixtures.testharness);
  wptGlobal.setup({explicit_done: true, output: false});

  wptGlobal.add_result_callback(testResult => {
    if (isRegisteringNoOpTest) {
      noOpTestResults.add(testResult);
      noOpTests++;
      return;
    }
    completedTests.push(normalizeTestResult(testResult));
  });

  const wptTest = wptGlobal.test;
  wptGlobal.test = (callback, name, properties) => {
    isRegisteringNoOpTest = isNoOpTestCallback(callback);
    try {
      wptTest(callback, name, properties);
    } finally {
      isRegisteringNoOpTest = false;
    }
  };

  const completion = new Promise<WPTObservedFileResult>(resolve => {
    wptGlobal.add_completion_callback((tests, harnessStatus) => {
      const normalizedHarnessStatus = statusName(
        HARNESS_STATUSES,
        harnessStatus.status,
      );
      const normalizedTests = tests
        .filter(testResult => !noOpTestResults.has(testResult))
        .map(normalizeTestResult);
      if (normalizedHarnessStatus !== 'OK') {
        normalizedTests.push({
          message: normalizedHarnessStatus,
          name: '<harness completion>',
          status:
            normalizedHarnessStatus === 'TIMEOUT'
              ? 'TIMEOUT'
              : normalizedHarnessStatus === 'PRECONDITION_FAILED'
                ? 'PRECONDITION_FAILED'
                : 'FAIL',
        });
      }
      resolve({
        harnessStatus: normalizedHarnessStatus,
        noOpTests,
        path: fixture.path,
        tests: normalizedTests.sort((a, b) =>
          a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
        ),
      });
    });
  });

  try {
    const source = [
      ...fixture.dependencies.map(dependency => dependency.source),
      fixture.source,
    ].join('\n');
    wptGlobal.eval(
      `(function () {\n${HERMES_SHOW_SOURCE_DIRECTIVE}\n${source}\n}).call(self);\n//# sourceURL=wpt/${fixture.path}`,
    );
  } catch (error) {
    wptGlobal.test(() => {
      throw error;
    }, '<file evaluation>');
  }

  wptGlobal.done();
  return {
    completion,
    timedOutResult: () => ({
      harnessStatus: 'TIMEOUT',
      noOpTests,
      path: fixture.path,
      tests: [
        ...completedTests,
        {
          message: 'The WPT file did not complete.',
          name: '<file completion>',
          status: 'TIMEOUT',
        },
      ].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)),
    }),
  };
}

function missingGlobalFromMessage(message: string): string | void {
  const hermesMatch = message.match(/Property '([^']+)' doesn't exist/);
  if (hermesMatch?.[1] != null) {
    return hermesMatch[1];
  }
  const referenceErrorMatch = message.match(
    /(?:ReferenceError:\s*)?([A-Za-z_$][\w$]*) is not defined/,
  );
  return referenceErrorMatch?.[1];
}

function isMissingRuntimeGlobal(name: string): boolean {
  return !(name in getWPTGlobal());
}

function collapseBlockedSuite(files: ReadonlyArray<WPTObservedFileResult>): {
  blocked?: WPTBlockedSuite,
  files: Array<WPTFileResult>,
} {
  const observedResults = files.flatMap(file =>
    file.tests.map(testResult => ({file: file.path, testResult})),
  );
  const classifiedResults = observedResults.map(({file, testResult}) => {
    const missingGlobal = missingGlobalFromMessage(testResult.message);
    return {
      file,
      missingGlobal:
        missingGlobal != null && isMissingRuntimeGlobal(missingGlobal)
          ? missingGlobal
          : null,
      testResult,
    };
  });
  const conformanceResults = classifiedResults.filter(
    ({testResult}) => !testResult.name.startsWith('<'),
  );
  const isBlocked =
    conformanceResults.length > 0 &&
    conformanceResults.every(
      ({missingGlobal, testResult}) =>
        testResult.status === 'FAIL' && missingGlobal != null,
    );

  if (!isBlocked) {
    return {
      files: files.map(file => ({
        harnessStatus: file.harnessStatus,
        path: file.path,
        tests: file.tests.map(({name, status}) => ({name, status})),
      })),
    };
  }

  const gatedResults = classifiedResults.filter(
    ({missingGlobal, testResult}) =>
      testResult.status === 'FAIL' && missingGlobal != null,
  );
  const missingGlobalCounts = new Map<string, number>();
  const gatedFiles = new Set<string>();
  for (const {file, missingGlobal} of gatedResults) {
    if (missingGlobal == null) {
      throw new Error('A blocked WPT result must name a missing global.');
    }
    gatedFiles.add(file);
    missingGlobalCounts.set(
      missingGlobal,
      (missingGlobalCounts.get(missingGlobal) ?? 0) + 1,
    );
  }
  const missingGlobalsByFrequency = [...missingGlobalCounts].sort(
    ([nameA, countA], [nameB, countB]) =>
      countB - countA || (nameA < nameB ? -1 : nameA > nameB ? 1 : 0),
  );
  const primaryMissingGlobal = missingGlobalsByFrequency[0]?.[0];
  if (primaryMissingGlobal == null) {
    throw new Error('A blocked WPT suite must name a primary missing global.');
  }

  return {
    blocked: {
      gatedFiles: gatedFiles.size,
      gatedTests: gatedResults.length,
      missingGlobals: [...missingGlobalCounts.keys()].sort(),
      reason: `${primaryMissingGlobal} not implemented`,
    },
    files: files
      .map((file): WPTFileResult => ({
        harnessStatus: file.harnessStatus,
        path: file.path,
        tests: file.tests
          .filter(
            testResult => missingGlobalFromMessage(testResult.message) == null,
          )
          .map(({name, status}) => ({name, status})),
      }))
      .filter(file => file.tests.length > 0),
  };
}

function summarizeWPTSuite(
  files: ReadonlyArray<WPTFileResult>,
  blockedTests: number,
  noOpTests: number,
  unsupportedFiles: number,
): WPTSummary {
  const summary = {
    BLOCKED: blockedTests,
    FAIL: 0,
    FLAKY: 0,
    NOTRUN: 0,
    PASS: 0,
    PRECONDITION_FAILED: 0,
    TIMEOUT: 0,
    noOpTests,
    total: blockedTests,
    unsupportedFiles,
  };

  for (const file of files) {
    for (const testResult of file.tests) {
      switch (testResult.status) {
        case 'FAIL':
          summary.FAIL++;
          break;
        case 'FLAKY':
          summary.FLAKY++;
          break;
        case 'NOTRUN':
          summary.NOTRUN++;
          break;
        case 'PASS':
          summary.PASS++;
          break;
        case 'PRECONDITION_FAILED':
          summary.PRECONDITION_FAILED++;
          break;
        case 'TIMEOUT':
          summary.TIMEOUT++;
          break;
      }
      summary.total++;
    }
  }

  return summary;
}

function isWPTStatusAccepted(
  actualStatus: string,
  baselineStatus: string,
): boolean {
  return baselineStatus === 'FLAKY' || actualStatus === baselineStatus;
}

export function applyWPTFlakyStatuses(
  result: WPTSuiteResult,
  baseline: WPTSuiteResult,
): WPTSuiteResult {
  const baselineFiles = new Map(
    baseline.files.map(file => [file.path, file.tests]),
  );
  const files = result.files.map(file => {
    const baselineTests = baselineFiles.get(file.path) ?? [];
    const occurrenceByName = new Map<string, number>();
    const flakyOccurrences = new Set<string>();
    for (const testResult of baselineTests) {
      const occurrence = occurrenceByName.get(testResult.name) ?? 0;
      occurrenceByName.set(testResult.name, occurrence + 1);
      if (testResult.status === 'FLAKY') {
        flakyOccurrences.add(`${testResult.name}\0${String(occurrence)}`);
      }
    }

    occurrenceByName.clear();
    return {
      ...file,
      tests: file.tests.map(testResult => {
        const occurrence = occurrenceByName.get(testResult.name) ?? 0;
        occurrenceByName.set(testResult.name, occurrence + 1);
        const baselineStatus = flakyOccurrences.has(
          `${testResult.name}\0${String(occurrence)}`,
        )
          ? 'FLAKY'
          : testResult.status;
        return {
          ...testResult,
          status: isWPTStatusAccepted(testResult.status, baselineStatus)
            ? baselineStatus
            : testResult.status,
        };
      }),
    };
  });

  return {
    ...result,
    files,
    summary: summarizeWPTSuite(
      files,
      result.summary.BLOCKED,
      result.summary.noOpTests,
      result.summary.unsupportedFiles,
    ),
  };
}

export function getWPTExecutionPaths(
  fixtures: WPTFixtures,
  suite: WPTSuiteName,
  executionOrder: WPTExecutionOrder,
): Array<string> {
  const paths = fixtures.suites[suite].map(fixture => fixture.path);
  if (executionOrder === 'manifest') {
    return paths;
  }

  let state = 0x2856095;
  for (let index = paths.length - 1; index > 0; index--) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    const swapIndex = state % (index + 1);
    const currentPath = paths[index];
    const swapPath = paths[swapIndex];
    if (currentPath == null || swapPath == null) {
      throw new Error('Could not shuffle WPT fixture paths.');
    }
    paths[index] = swapPath;
    paths[swapIndex] = currentPath;
  }
  return paths;
}

export function runWPTSuite(
  fixtures: WPTFixtures,
  suite: WPTSuiteName,
  executionOrder: WPTExecutionOrder = 'manifest',
): WPTSuiteResult {
  const wptGlobal = getWPTGlobal();
  const originalTestDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'test',
  );
  if (originalTestDescriptor == null) {
    throw new Error('The Jest test global is not defined.');
  }
  const files: Array<WPTObservedFileResult> = [];
  const fixturesByPath = new Map(
    fixtures.suites[suite].map(fixture => [fixture.path, fixture]),
  );

  try {
    for (const fixturePath of getWPTExecutionPaths(
      fixtures,
      suite,
      executionOrder,
    )) {
      const fixture = fixturesByPath.get(fixturePath);
      if (fixture == null) {
        throw new Error(`Missing WPT fixture ${fixturePath}.`);
      }
      let completedResult: WPTObservedFileResult | void;
      let pendingFile: PendingWPTFile | void;
      Fantom.runTask(async () => {
        pendingFile = beginWPTFile(fixtures, fixture);
        completedResult = await pendingFile.completion;
      });
      const fallbackResult: WPTObservedFileResult = {
        harnessStatus: 'ERROR',
        noOpTests: 0,
        path: fixture.path,
        tests: [
          {
            message: 'The WPT file could not be initialized.',
            name: '<file setup>',
            status: 'FAIL',
          },
        ],
      };
      files.push(
        completedResult ?? pendingFile?.timedOutResult() ?? fallbackResult,
      );
    }
  } finally {
    // $FlowExpectedError[incompatible-type] The descriptor contains Jest's test function, not WPT's.
    Object.defineProperty(wptGlobal, 'test', originalTestDescriptor);
  }

  const noOpTests = files.reduce((count, file) => count + file.noOpTests, 0);
  const collapsed = collapseBlockedSuite(files);
  const sortedFiles = collapsed.files.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );

  return {
    ...(collapsed.blocked == null ? {} : {blocked: collapsed.blocked}),
    files: sortedFiles,
    manifest: fixtures.manifest,
    revision: fixtures.revision,
    source: fixtures.source,
    summary: summarizeWPTSuite(
      sortedFiles,
      collapsed.blocked?.gatedTests ?? 0,
      noOpTests,
      fixtures.unsupported[suite].length,
    ),
    suite,
  };
}
