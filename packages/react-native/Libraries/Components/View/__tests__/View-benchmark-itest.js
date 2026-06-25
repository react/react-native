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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

let root;
let testViews: React.MixedElement;

function createDeepViewHierarchy(depth: number, breadth: number): React.Node {
  if (depth === 0) {
    return (
      <View
        collapsable={false}
        style={{width: 10, height: 10}}
        nativeID="leaf"
      />
    );
  }
  const children = [];
  for (let i = 0; i < breadth; i++) {
    children.push(
      <View
        key={i}
        collapsable={false}
        nativeID={`d${depth.toString()}-${i.toString()}`}
        style={{width: depth + 1, height: depth + 1}}>
        {createDeepViewHierarchy(depth - 1, breadth)}
      </View>,
    );
  }
  return <View collapsable={false}>{children}</View>;
}

function createViewsWithLargeAmountOfPropsAndStyles(count: number): React.Node {
  let views: React.Node = null;
  for (let i = 0; i < count; i++) {
    views = (
      <View
        accessibilityLabelledBy={'test ${i}'}
        accessibilityLiveRegion={'polite'}
        aria-labelledby={'test ${i}'}
        aria-live={'polite'}
        collapsable={false}
        focusable={i % 2 === 0}
        hasTVPreferredFocus={i % 2 === 0}
        id={String(i)}
        importantForAccessibility={'no-hide-descendants'}
        nativeID={String(i)}
        nextFocusDown={i}
        nextFocusForward={i + 1}
        nextFocusLeft={i + 2}
        nextFocusRight={i + 3}
        nextFocusUp={i + 4}
        renderToHardwareTextureAndroid={true}
        style={{
          width: i + 1,
          height: i + 1,
          backgroundColor: 'blue',
          borderCurve: 'circular',
          borderBottomWidth: i % 2 === 0 ? 0 : 1,
          borderWidth: i % 2 === 0 ? 0 : 1,
          borderEndWidth: i % 2 === 0 ? 0 : 1,
          borderLeftWidth: i % 2 === 0 ? 0 : 1,
          borderRightWidth: i % 2 === 0 ? 0 : 1,
          borderStartWidth: i % 2 === 0 ? 0 : 1,
          borderTopWidth: i % 2 === 0 ? 0 : 1,
          borderBottomColor: i % 2 === 0 ? 'blue' : 'red',
          borderEndColor: i % 2 === 0 ? 'blue' : 'red',
          borderStartColor: i % 2 === 0 ? 'blue' : 'red',
          borderTopColor: i % 2 === 0 ? 'blue' : 'red',
          borderRightColor: i % 2 === 0 ? 'blue' : 'red',
          borderLeftColor: i % 2 === 0 ? 'blue' : 'red',
          opacity: i % 2 === 0 ? 0 : 1,
          elevation: i % 2 === 0 ? 0 : 1,
          pointerEvents: 'auto',
          boxShadow: '0 0 0 1px blue',
          isolation: 'isolate',
          cursor: 'pointer',
          backfaceVisibility: 'visible',
          mixBlendMode: 'multiply',
        }}
        tabIndex={i % 2 === 0 ? 0 : undefined}>
        {views}
      </View>
    );
  }
  return views;
}

Fantom.unstable_benchmark
  .suite('View')
  .test.each(
    [100, 1000],
    n => `render ${n.toString()} uncollapsable views`,
    () => {
      Fantom.runTask(() => root.render(testViews));
    },
    n => ({
      beforeAll: () => {
        let views: React.Node = null;
        for (let i = 0; i < n; i++) {
          views = (
            <View
              collapsable={false}
              id={String(i)}
              nativeID={String(i)}
              style={{width: i + 1, height: i + 1}}>
              {views}
            </View>
          );
        }
        // $FlowExpectedError[incompatible-type]
        testViews = views;
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
    n => `render ${n.toString()} views with large amount of props and styles`,
    () => {
      Fantom.runTask(() => root.render(testViews));
    },
    n => ({
      beforeAll: () => {
        // $FlowExpectedError[incompatible-type]
        testViews = createViewsWithLargeAmountOfPropsAndStyles(n);
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
    [
      [5, 4],
      [7, 3],
      [10, 2],
    ],
    ([depth, breadth]) =>
      `render deep view hierarchy (depth=${depth.toString()}, breadth=${breadth.toString()})`,
    () => {
      Fantom.runTask(() => root.render(testViews));
    },
    ([depth, breadth]) => ({
      beforeAll: () => {
        // $FlowExpectedError[incompatible-type]
        testViews = createDeepViewHierarchy(depth, breadth);
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
    [10, 50, 100],
    n => `reorder ${n.toString()} children (move first to last)`,
    () => {
      Fantom.runTask(() => root.render(testViews));
    },
    n => {
      let original: React.MixedElement;
      let reordered: React.MixedElement;
      return {
        beforeAll: () => {
          const children = [];
          for (let i = 0; i < n; i++) {
            children.push(
              <View
                key={i}
                collapsable={false}
                nativeID={`child-${i.toString()}`}
                style={{width: i + 1, height: i + 1}}
              />,
            );
          }
          original = (
            <View collapsable={false} nativeID="parent">
              {children}
            </View>
          );
          // Move first child to last
          const reorderedChildren = [...children.slice(1), children[0]];
          reordered = (
            <View collapsable={false} nativeID="parent">
              {reorderedChildren}
            </View>
          );
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => root.render(original));
          // $FlowExpectedError[incompatible-type]
          testViews = reordered;
        },
        afterEach: () => {
          root.destroy();
        },
      };
    },
  )
  .test.each(
    [10, 50, 100],
    n => `reorder ${n.toString()} children (swap first two)`,
    () => {
      Fantom.runTask(() => root.render(testViews));
    },
    n => {
      let original: React.MixedElement;
      let reordered: React.MixedElement;
      return {
        beforeAll: () => {
          const children = [];
          for (let i = 0; i < n; i++) {
            children.push(
              <View
                key={i}
                collapsable={false}
                nativeID={`child-${i.toString()}`}
                style={{width: i + 1, height: i + 1}}
              />,
            );
          }
          original = (
            <View collapsable={false} nativeID="parent">
              {children}
            </View>
          );
          // Swap first two children — both algorithms handle this equally
          const swapped = [children[1], children[0], ...children.slice(2)];
          reordered = (
            <View collapsable={false} nativeID="parent">
              {swapped}
            </View>
          );
        },
        beforeEach: () => {
          root = Fantom.createRoot();
          Fantom.runTask(() => root.render(original));
          // $FlowExpectedError[incompatible-type]
          testViews = reordered;
        },
        afterEach: () => {
          root.destroy();
        },
      };
    },
  );
