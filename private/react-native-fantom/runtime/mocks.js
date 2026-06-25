/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export const MOCK_FN_TAG: symbol = Symbol('mock function');

// The type is defined this way because if we get a mixed value, we return
// a generic mock function, and if we get a typed function, we get a typed mock.
export const ensureMockFunction: (<TArgs extends Array<unknown>, TReturn>(
  fn: (...TArgs) => TReturn,
) => JestMockFn<TArgs, TReturn>) &
  ((fn: unknown) => JestMockFn<Array<unknown>, unknown>) = fn => {
  // $FlowExpectedError[invalid-computed-prop]
  // $FlowExpectedError[incompatible-use]
  if (typeof fn !== 'function' || !fn[MOCK_FN_TAG]) {
    throw new Error(
      `Expected ${String(fn)} to be a mock function, but it wasn't`,
    );
  }

  // $FlowExpectedError[incompatible-type]
  // $FlowExpectedError[prop-missing]
  return fn;
};

export function createMockFunction<TArgs extends Array<unknown>, TReturn>(
  initialImplementation?: (...TArgs) => TReturn,
): JestMockFn<TArgs, TReturn> {
  let implementation: ?(...TArgs) => TReturn = initialImplementation;

  const mock: JestMockFn<TArgs, TReturn>['mock'] = {
    calls: [],
    // $FlowExpectedError[incompatible-type]
    lastCall: undefined,
    instances: [],
    contexts: [],
    results: [],
  };

  const mockFunction = function (this: unknown, ...args: TArgs): TReturn {
    let result: JestMockFn<TArgs, TReturn>['mock']['results'][number] = {
      isThrow: false,
      // $FlowExpectedError[incompatible-type]
      value: undefined,
    };

    if (implementation != null) {
      try {
        result.value = implementation.apply(this, args);
      } catch (error) {
        result.isThrow = true;
        result.value = error;
      }
    }

    mock.calls.push(args);
    mock.lastCall = args;
    // $FlowExpectedError[incompatible-type]
    mock.instances.push(new.target ? this : undefined);
    mock.contexts.push(this);
    mock.results.push(result);

    if (result.isThrow) {
      throw result.value;
    }

    return result.value;
  };

  mockFunction.mock = mock;
  // $FlowExpectedError[invalid-computed-prop]
  mockFunction[MOCK_FN_TAG] = true;

  // $FlowExpectedError[incompatible-type]
  return mockFunction;
}
