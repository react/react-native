/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableFabricCommitBranching:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {Node} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {HostInstance} from 'react-native';

import {getNodeFromPublicInstance} from '../../../../../Libraries/ReactPrivate/ReactNativePrivateInterface';
import isUnreachable from '../isUnreachable';
import {
  createShadowNodeReferenceCounter,
  createShadowNodeReferenceCountingRef,
} from '../ShadowNodeReferenceCounter';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {View} from 'react-native';

test('shadow node expires when root is destroyed', () => {
  const root = Fantom.createRoot();

  const [getReferenceCount, ref] = createShadowNodeReferenceCountingRef();

  Fantom.runTask(() => {
    root.render(<View ref={ref} />);
  });

  expect(getReferenceCount()).toBeGreaterThan(0);

  Fantom.runTask(() => {
    root.destroy();
  });

  expect(getReferenceCount()).toBe(0);
});

test('element is not retained by `createShadowNodeReferenceCounter`', () => {
  const root = Fantom.createRoot();

  let elementWeakRef: ?WeakRef<HostInstance>;
  let getReferenceCount: ?() => number;

  function ref(instance: HostInstance | null) {
    if (instance == null) {
      return;
    }
    const element = nullthrows(instance);
    elementWeakRef = new WeakRef(element);
    getReferenceCount = createShadowNodeReferenceCounter(element);
  }

  Fantom.runTask(() => {
    root.render(
      <View>
        <View ref={ref} />
      </View>,
    );
  });

  expect(isUnreachable(nullthrows(elementWeakRef))).toBe(false);
  expect(getReferenceCount?.()).toBeGreaterThan(0);

  Fantom.runTask(() => {
    root.destroy();
  });

  expect(isUnreachable(nullthrows(elementWeakRef))).toBe(true);
  expect(getReferenceCount?.()).toBe(0);
});

test('shadow node expires when JavaScript element is reachable', () => {
  const root = Fantom.createRoot();

  let element: ?HostInstance;
  let getReferenceCount: ?() => number;

  function ref(instance: HostInstance | null) {
    if (instance == null) {
      return;
    }
    element = nullthrows(instance);
    getReferenceCount = createShadowNodeReferenceCounter(element);
  }

  Fantom.runTask(() => {
    root.render(
      <View>
        <View ref={ref} />
      </View>,
    );
  });

  expect(element).not.toBe(undefined);
  expect(getNodeFromPublicInstance(nullthrows(element))).not.toBe(null);
  expect(getReferenceCount?.()).toBeGreaterThan(0);

  Fantom.runTask(() => {
    root.destroy();
  });

  expect(element).not.toBe(undefined);
  expect(getNodeFromPublicInstance(nullthrows(element))).toBe(null);
  expect(getReferenceCount?.()).toBe(0);
});

test('shadow node is retained when JavaScript node is reachable', () => {
  const root = Fantom.createRoot();

  let node: ?Node;
  let getReferenceCount: ?() => number;

  function ref(instance: HostInstance | null) {
    if (instance == null) {
      return;
    }
    const element = nullthrows(instance);
    node = getNodeFromPublicInstance(element);
    getReferenceCount = createShadowNodeReferenceCounter(element);
  }

  Fantom.runTask(() => {
    root.render(
      <View>
        <View ref={ref} />
      </View>,
    );
  });

  expect(node).not.toBe(undefined);
  expect(getReferenceCount?.()).toBeGreaterThan(0);

  Fantom.runTask(() => {
    root.destroy();
  });

  expect(node).not.toBe(undefined);
  expect(getReferenceCount?.()).toBeGreaterThan(0);
});

test('shadow node expires when replaced by null', () => {
  const root = Fantom.createRoot();

  const [getReferenceCount, ref] = createShadowNodeReferenceCountingRef();

  Fantom.runTask(() => {
    root.render(
      <View>
        <View ref={ref} />
      </View>,
    );
  });

  expect(getReferenceCount()).toBeGreaterThan(0);

  Fantom.runTask(() => {
    root.render(<View>{null}</View>);
  });

  expect(getReferenceCount()).toBe(0);
});

test('shadow node expires when replaced by another view', () => {
  const root = Fantom.createRoot();

  const [getReferenceCount, ref] = createShadowNodeReferenceCountingRef();

  Fantom.runTask(() => {
    root.render(
      <View>
        <View key="a" ref={ref} />
      </View>,
    );
  });

  expect(getReferenceCount()).toBeGreaterThan(0);

  Fantom.runTask(() => {
    root.render(
      <View>
        <View key="b" />
      </View>,
    );
  });

  expect(getReferenceCount()).toBe(0);
});
