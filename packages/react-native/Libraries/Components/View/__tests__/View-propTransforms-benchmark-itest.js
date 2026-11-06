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

import measureRenderTime from '../../../../src/private/__tests__/utilities/measureRenderTime';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

const COUNT = 100;

let root: Fantom.Root;
let initial: React.MixedElement;
let next: React.MixedElement;

type Variant = Readonly<{
  name: string,
  update: boolean,
  render: (i: number, gen: number) => React.Node,
}>;

const variants: ReadonlyArray<Variant> = [
  {
    name: 'mount, plain (fast path)',
    update: false,
    render: i => <View key={i} style={{width: i + 1, height: 1}} />,
  },
  {
    name: 'update, plain (fast path)',
    update: true,
    render: (i, gen) => <View key={i} style={{width: i + gen, height: 1}} />,
  },
  {
    name: 'mount, testID + pointerEvents (fast path)',
    update: false,
    render: i => (
      <View
        key={i}
        testID={'v' + i}
        pointerEvents="box-none"
        style={{width: i + 1, height: 1}}
      />
    ),
  },
  {
    name: 'mount, aria-label (slow path)',
    update: false,
    render: i => (
      <View key={i} aria-label={'v' + i} style={{width: i + 1, height: 1}} />
    ),
  },
  {
    name: 'update, aria-label (slow path)',
    update: true,
    render: (i, gen) => (
      <View key={i} aria-label={'v' + i} style={{width: i + gen, height: 1}} />
    ),
  },
  {
    name: 'mount, accessibilityState (slow path, like Pressable)',
    update: false,
    render: i => (
      <View
        key={i}
        accessibilityState={{disabled: false}}
        style={{width: i + 1, height: 1}}
      />
    ),
  },
];

function build(variant: Variant, gen: number): React.MixedElement {
  const children = [];
  for (let i = 0; i < COUNT; i++) {
    children.push(variant.render(i, gen));
  }
  return <>{children}</>;
}

Fantom.unstable_benchmark
  .suite('View prop transforms', {minIterations: 1000})
  .test.each(
    variants,
    variant => `${variant.name}, ${COUNT} views`,
    () => ({overriddenDuration: measureRenderTime(root, next)}),
    variant => ({
      beforeAll: () => {
        initial = build(variant, 1);
        next = variant.update ? build(variant, 2) : initial;
      },
      beforeEach: () => {
        root = Fantom.createRoot();
        if (variant.update) {
          // Same wrapper as the measured render, so React updates in place.
          measureRenderTime(root, initial);
        }
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  );
