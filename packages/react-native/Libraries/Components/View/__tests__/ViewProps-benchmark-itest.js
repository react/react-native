/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableCppPropsIteratorSetter:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

let root;
let initialTree: React.MixedElement;
let updatedTree: React.MixedElement;

function buildViewsWithFullPropBag(
  count: number,
  variant: 'a' | 'b',
): React.MixedElement {
  const accent = variant === 'a' ? 'blue' : 'red';
  const offset = variant === 'a' ? 0 : 1;
  const children = [];
  for (let i = 0; i < count; i++) {
    children.push(
      <View
        key={i}
        accessibilityLabelledBy={`label-${i.toString()}`}
        accessibilityLiveRegion="polite"
        aria-labelledby={`label-${i.toString()}`}
        aria-live="polite"
        collapsable={false}
        focusable={i % 2 === 0}
        hasTVPreferredFocus={i % 2 === 0}
        id={String(i)}
        importantForAccessibility="no-hide-descendants"
        nativeID={String(i)}
        nextFocusDown={i + offset}
        nextFocusForward={i + 1 + offset}
        nextFocusLeft={i + 2 + offset}
        nextFocusRight={i + 3 + offset}
        nextFocusUp={i + 4 + offset}
        renderToHardwareTextureAndroid={true}
        style={{
          width: i + 1 + offset,
          height: i + 1 + offset,
          backgroundColor: accent,
          borderCurve: 'circular',
          borderBottomWidth: i % 2 === 0 ? 0 : 1,
          borderWidth: i % 2 === 0 ? 0 : 1,
          borderEndWidth: i % 2 === 0 ? 0 : 1,
          borderLeftWidth: i % 2 === 0 ? 0 : 1,
          borderRightWidth: i % 2 === 0 ? 0 : 1,
          borderStartWidth: i % 2 === 0 ? 0 : 1,
          borderTopWidth: i % 2 === 0 ? 0 : 1,
          borderBottomColor: accent,
          borderEndColor: accent,
          borderStartColor: accent,
          borderTopColor: accent,
          borderRightColor: accent,
          borderLeftColor: accent,
          opacity: i % 2 === 0 ? 0 : 1,
          elevation: i % 2 === 0 ? 0 : 1,
          pointerEvents: 'auto',
          boxShadow: '0 0 0 1px ' + accent,
          isolation: 'isolate',
          cursor: 'pointer',
          backfaceVisibility: 'visible',
          mixBlendMode: 'multiply',
        }}
        tabIndex={i % 2 === 0 ? 0 : undefined}
      />,
    );
  }
  return (
    <View collapsable={false} nativeID="root">
      {children}
    </View>
  );
}

function buildViewsWithSinglePropDelta(
  count: number,
  toggle: boolean,
): React.MixedElement {
  const children = [];
  for (let i = 0; i < count; i++) {
    children.push(
      <View
        key={i}
        collapsable={false}
        nativeID={String(i)}
        style={{
          width: i + 1,
          height: i + 1,
          opacity: toggle && i % 2 === 0 ? 0.5 : 1,
        }}
      />,
    );
  }
  return (
    <View collapsable={false} nativeID="root">
      {children}
    </View>
  );
}

Fantom.unstable_benchmark
  .suite('Props construction')
  .test.each(
    [100, 1000],
    n => `mount ${n.toString()} views with full prop bag`,
    () => {
      Fantom.runTask(() => root.render(initialTree));
    },
    n => ({
      beforeAll: () => {
        initialTree = buildViewsWithFullPropBag(n, 'a');
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  )
  .test.each(
    [100, 1000],
    n => `re-render ${n.toString()} views with full prop swap (cloneProps)`,
    () => {
      Fantom.runTask(() => root.render(updatedTree));
    },
    n => ({
      beforeAll: () => {
        initialTree = buildViewsWithFullPropBag(n, 'a');
        updatedTree = buildViewsWithFullPropBag(n, 'b');
      },
      beforeEach: () => {
        root = Fantom.createRoot();
        Fantom.runTask(() => root.render(initialTree));
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  )
  .test.each(
    [100, 1000],
    n => `re-render ${n.toString()} views with single-prop delta (cloneProps)`,
    () => {
      Fantom.runTask(() => root.render(updatedTree));
    },
    n => ({
      beforeAll: () => {
        initialTree = buildViewsWithSinglePropDelta(n, false);
        updatedTree = buildViewsWithSinglePropDelta(n, true);
      },
      beforeEach: () => {
        root = Fantom.createRoot();
        Fantom.runTask(() => root.render(initialTree));
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  );
