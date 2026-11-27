/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const jestExpect = expect;
const jestRuntime = jest;
const globalNames = [
  'describe',
  'fdescribe',
  'xdescribe',
  'it',
  'fit',
  'xit',
  'test',
  'xtest',
  'afterAll',
  'afterEach',
  'beforeAll',
  'beforeEach',
  'expect',
  'jest',
  '$$RunTests$$',
];
let descriptors: Map<string, PropertyDescriptor | void>;

jest.mock('../expect', () => () => {});
jest.mock('../patchWeakRef', () => () => {});
jest.mock(
  '../../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom',
  () => ({
    __esModule: true,
    default: {
      validateEmptyMessageQueue: jest.fn(),
      reportTestSuiteResultsJSON: jest.fn(),
    },
  }),
);

beforeEach(() => {
  descriptors = new Map(
    globalNames.map(name => [
      name,
      Object.getOwnPropertyDescriptor(global, name),
    ]),
  );
  jestRuntime.resetModules();
});

afterEach(() => {
  for (const [name, descriptor] of descriptors) {
    if (descriptor == null) {
      delete global[name];
    } else {
      Object.defineProperty(global, name, descriptor);
    }
  }
});

function results() {
  const NativeFantom =
    require('../../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom').default;
  let report;
  jestRuntime
    .spyOn(NativeFantom, 'reportTestSuiteResultsJSON')
    .mockImplementation(json => {
      report = JSON.parse(json);
    });
  global.$$RunTests$$();
  return report?.testResults ?? [];
}

it('runs teardown after a failed test before running the next test', () => {
  const {registerTest} = require('../setup');
  const events = [];
  registerTest(
    () => {
      beforeEach(() => {
        events.push('setup');
      });
      afterEach(() => {
        events.push('teardown');
      });
      it('fails', () => {
        events.push('failed test');
        throw new Error('assertion failed');
      });
      it('passes', () => {
        events.push('next test');
      });
    },
    {data: {}, updateSnapshot: 'none'},
  );
  const [failed, passed] = results();
  jestExpect(failed.status).toBe('failed');
  jestExpect(failed.failureMessages[0]).toContain('assertion failed');
  jestExpect(passed.status).toBe('passed');
  jestExpect(events).toEqual([
    'setup',
    'failed test',
    'teardown',
    'setup',
    'next test',
    'teardown',
  ]);
});

for (const nonErrorPosition of ['test', 'teardown']) {
  it(`keeps error details aligned when ${nonErrorPosition} throws a non-Error value`, () => {
    const {registerTest} = require('../setup');
    const error = new Error('ordinary error');
    const errors =
      nonErrorPosition === 'test'
        ? ['non-error failure', error]
        : [error, 'non-error failure'];
    registerTest(
      () => {
        afterEach(() => {
          throw errors[1];
        });
        it(`fails with non-Error in ${nonErrorPosition}`, () => {
          throw errors[0];
        });
      },
      {data: {}, updateSnapshot: 'none'},
    );
    const [failed] = results();
    const nonErrorIndex = nonErrorPosition === 'test' ? 0 : 1;
    const errorIndex = 1 - nonErrorIndex;
    jestExpect(failed.failureMessages.length).toBe(2);
    jestExpect(failed.failureDetails.length).toBe(2);
    jestExpect(failed.failureDetails[nonErrorIndex]).toBe(null);
    jestExpect(failed.failureDetails[errorIndex].message).toBe(
      'ordinary error',
    );
    jestExpect(failed.failureMessages[nonErrorIndex]).toContain(
      'non-error failure',
    );
    jestExpect(failed.failureMessages[errorIndex]).toContain('ordinary error');
  });
}

it('runs teardown after a failed setup and retains both errors', () => {
  const {registerTest} = require('../setup');
  registerTest(
    () => {
      beforeEach(() => {
        throw new Error('setup failed');
      });
      afterEach(() => {
        throw new Error('teardown failed');
      });
      it('does not run', () => {
        throw new Error('test should not run');
      });
    },
    {data: {}, updateSnapshot: 'none'},
  );
  const [failed] = results();
  jestExpect(failed.status).toBe('failed');
  jestExpect(failed.failureDetails[0].message).toBe('setup failed');
  jestExpect(failed.failureDetails[1].message).toBe('teardown failed');
});

it('preserves screenshot text errors alongside preview errors and teardown failures', () => {
  const {registerTest} = require('../setup');
  const {ScreenshotSnapshotError} = require('../snapshotContext');
  registerTest(
    () => {
      afterEach(() => {
        throw new Error('teardown failed');
      });
      it('fails screenshot assertion', () => {
        throw new ScreenshotSnapshotError(
          'Expected old-hash, received new-hash',
          'Expected to match screenshot snapshot.',
        );
      });
    },
    {data: {}, updateSnapshot: 'none'},
  );
  const [failed] = results();
  jestExpect(failed.failureMessages[0]).toContain('old-hash');
  jestExpect(failed.failureDetails[0].message).toContain('old-hash');
  jestExpect(failed.screenshotFailureMessages[0]).toContain(
    'Expected to match screenshot snapshot.',
  );
  jestExpect(failed.screenshotFailureMessages[0]).not.toContain('old-hash');
  jestExpect(failed.screenshotFailureMessages[1]).toBe(null);
});

for (const screenshotPosition of ['test', 'teardown']) {
  it(`keeps failure indexes aligned when the screenshot fails in ${screenshotPosition}`, () => {
    const {registerTest} = require('../setup');
    const {ScreenshotSnapshotError} = require('../snapshotContext');
    const screenshotError = new ScreenshotSnapshotError(
      'Expected old-hash, received new-hash',
      'Expected to match screenshot snapshot.',
    );
    const errors =
      screenshotPosition === 'test'
        ? [screenshotError, 'non-error failure']
        : ['non-error failure', screenshotError];
    registerTest(
      () => {
        afterEach(() => {
          throw errors[1];
        });
        it(`fails with screenshot in ${screenshotPosition}`, () => {
          throw errors[0];
        });
      },
      {data: {}, updateSnapshot: 'none'},
    );
    const [failed] = results();
    const screenshotIndex = screenshotPosition === 'test' ? 0 : 1;
    const nonErrorIndex = 1 - screenshotIndex;
    jestExpect(failed.failureDetails.length).toBe(2);
    jestExpect(failed.failureDetails[nonErrorIndex]).toBe(null);
    jestExpect(failed.failureDetails[screenshotIndex].message).toContain(
      'old-hash',
    );
    jestExpect(failed.screenshotFailureMessages[screenshotIndex]).toContain(
      'Expected to match screenshot snapshot.',
    );
    jestExpect(failed.screenshotFailureMessages[screenshotIndex]).not.toContain(
      'old-hash',
    );
    jestExpect(failed.screenshotFailureMessages[nonErrorIndex]).toBe(null);
    jestExpect(failed.failureMessages[nonErrorIndex]).toContain(
      'non-error failure',
    );
  });
}
