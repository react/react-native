/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from '../../../src/private/types/HostInstance';

import View from '../../Components/View/View';
import useMergeRefs from '../useMergeRefs';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

function TestComponent(
  props: Readonly<{children: () => React.MixedElement}>,
): React.Node {
  return props.children();
}

function id(instance: HostInstance | null): string | null {
  if (instance == null) {
    return null;
  }
  return instance.id;
}

test('accepts a ref callback', () => {
  const root = Fantom.createRoot();
  const ledger: Array<{[string]: string | null}> = [];

  const ref = (current: HostInstance | null) => {
    ledger.push({ref: id(current)});
  };

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="foo" key="foo" ref={useMergeRefs(ref)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([{ref: 'foo'}]);

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="bar" key="bar" ref={useMergeRefs(ref)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([{ref: 'foo'}, {ref: null}, {ref: 'bar'}]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(ledger).toEqual([
    {ref: 'foo'},
    {ref: null},
    {ref: 'bar'},
    {ref: null},
  ]);
});

test('accepts a ref callback that returns a cleanup function', () => {
  const root = Fantom.createRoot();
  const ledger: Array<{[string]: string | null}> = [];

  // TODO: Remove `| null` after Flow supports ref cleanup functions.
  const ref = (current: HostInstance | null) => {
    ledger.push({ref: id(current)});
    return () => {
      ledger.push({ref: null});
    };
  };

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="foo" key="foo" ref={useMergeRefs(ref)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([{ref: 'foo'}]);

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="bar" key="bar" ref={useMergeRefs(ref)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([{ref: 'foo'}, {ref: null}, {ref: 'bar'}]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(ledger).toEqual([
    {ref: 'foo'},
    {ref: null},
    {ref: 'bar'},
    {ref: null},
  ]);
});

test('accepts a ref object', () => {
  const root = Fantom.createRoot();
  const ledger: Array<{[string]: string | null}> = [];

  const ref = {
    // $FlowFixMe[unsafe-getters-setters] - Intentional.
    set current(current: HostInstance | null) {
      ledger.push({ref: id(current)});
    },
  };

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="foo" key="foo" ref={useMergeRefs(ref)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([{ref: 'foo'}]);

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="bar" key="bar" ref={useMergeRefs(ref)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([{ref: 'foo'}, {ref: null}, {ref: 'bar'}]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(ledger).toEqual([
    {ref: 'foo'},
    {ref: null},
    {ref: 'bar'},
    {ref: null},
  ]);
});

test('invokes refs in order', () => {
  const root = Fantom.createRoot();
  const ledger: Array<{[string]: string | null}> = [];

  const refA = (current: HostInstance | null) => {
    ledger.push({refA: id(current)});
  };
  const refB = {
    // $FlowFixMe[unsafe-getters-setters] - Intentional.
    set current(current: HostInstance | null) {
      ledger.push({refB: id(current)});
    },
  };
  const refC = (current: HostInstance | null) => {
    ledger.push({refC: id(current)});
  };
  const refD = {
    // $FlowFixMe[unsafe-getters-setters] - Intentional.
    set current(current: HostInstance | null) {
      ledger.push({refD: id(current)});
    },
  };

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="foo" key="foo" ref={useMergeRefs(refA, refB, refC, refD)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refC: 'foo'},
    {refD: 'foo'},
  ]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refC: 'foo'},
    {refD: 'foo'},
    {refA: null},
    {refB: null},
    {refC: null},
    {refD: null},
  ]);
});

// This is actually undesirable behavior, but it's what we have so let's make
// sure it does not change unexpectedly.
test('invokes all refs if any ref changes', () => {
  const root = Fantom.createRoot();
  const ledger: Array<{[string]: string | null}> = [];

  const refA = (current: HostInstance | null) => {
    ledger.push({refA: id(current)});
  };
  const refB = (current: HostInstance | null) => {
    ledger.push({refB: id(current)});
  };

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="foo" key="foo" ref={useMergeRefs(refA, refB)} />
        )}
      </TestComponent>,
    );
  });

  const refAPrime = (current: HostInstance | null) => {
    ledger.push({refAPrime: id(current)});
  };

  Fantom.runTask(() => {
    root.render(
      <TestComponent>
        {() => (
          // $FlowFixMe[react-rule-hook]
          <View id="foo" key="foo" ref={useMergeRefs(refAPrime, refB)} />
        )}
      </TestComponent>,
    );
  });

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refA: null},
    {refB: null},
    {refAPrime: 'foo'},
    {refB: 'foo'},
  ]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(ledger).toEqual([
    {refA: 'foo'},
    {refB: 'foo'},
    {refA: null},
    {refB: null},
    {refAPrime: 'foo'},
    {refB: 'foo'},
    {refAPrime: null},
    {refB: null},
  ]);
});
