/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

// Must not be a substring of this test's own bundle URL, which appears in
// every stack trace.
const SOURCE_URL = 'split-chunk-under-test.bundle';

function getHelper(): (code: string, sourceUrl?: string) => unknown {
  // $FlowFixMe[prop-missing]
  const helper = global.globalEvalWithSourceUrl;
  if (typeof helper !== 'function') {
    throw new Error(
      `Expected global.globalEvalWithSourceUrl to be a function, got ${typeof helper}`,
    );
  }
  return helper;
}

function getStack(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    return String(e?.stack ?? '');
  }
  throw new Error('Expected the evaluated code to throw');
}

describe('globalEvalWithSourceUrl', () => {
  afterEach(() => {
    // $FlowFixMe[prop-missing]
    delete globalThis.__fantomEvalMarker;
  });

  it('is installed on the bridgeless runtime', () => {
    // $FlowFixMe[prop-missing]
    expect(typeof global.globalEvalWithSourceUrl).toBe('function');
  });

  it('evaluates the same source as JS eval() in the global scope', () => {
    const source = 'globalThis.__fantomEvalMarker = 17; 17';

    // eslint-disable-next-line no-eval
    expect(eval(source)).toBe(17);
    // $FlowFixMe[prop-missing]
    expect(globalThis.__fantomEvalMarker).toBe(17);

    // $FlowFixMe[prop-missing]
    delete globalThis.__fantomEvalMarker;

    expect(getHelper()(source, SOURCE_URL)).toBe(17);
    // $FlowFixMe[prop-missing]
    expect(globalThis.__fantomEvalMarker).toBe(17);
  });

  it('attributes evaluated code to the given source URL, unlike eval()', () => {
    const source = 'throw new Error("thrown from evaluated source")';

    // eslint-disable-next-line no-eval
    const evalStack = getStack(() => eval(source));
    const helperStack = getStack(() => getHelper()(source, SOURCE_URL));

    expect(evalStack).not.toContain(SOURCE_URL);
    expect(helperStack).toContain(SOURCE_URL);
  });

  it('rejects an invalid argument count', () => {
    const helper = getHelper();
    // $FlowFixMe[incompatible-type]
    expect(() => helper()).toThrow(
      'globalEvalWithSourceUrl arg count must be 1 or 2',
    );
  });
});
