/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {LayoutAnimation, View} from 'react-native';

// Note: Fantom's mock mounting layer commits the post-animation layout in a
// single mounting instruction — it does not replay the C++
// LayoutAnimationKeyFrameManager's per-frame interpolation, so stepping the
// virtual clock exposes only the final layout (verified: the box jumps straight
// to its end size and `takeMountingManagerLogs` shows a single Update, with no
// intermediate frames). These tests therefore exercise the JS LayoutAnimation
// config/creation paths and assert that the configured layout change is
// applied; intermediate-frame verification would require frame-by-frame
// interpolation support in Fantom's mounting layer.
function renderBox(
  viewRef: {current: HostInstance | null},
  width: number,
): React.MixedElement {
  return (
    <View
      ref={viewRef}
      nativeID="box"
      collapsable={false}
      style={{width, height: 100}}
    />
  );
}

describe('LayoutAnimation', () => {
  it('applies the layout change scheduled with a preset', () => {
    const viewRef = createRef<HostInstance>();
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(renderBox(viewRef, 100));
    });

    const element = nullthrows(viewRef.current);
    expect(element.getBoundingClientRect().width).toBe(100);

    Fantom.runTask(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      root.render(renderBox(viewRef, 300));
    });

    Fantom.unstable_produceFramesForDuration(500);
    Fantom.runWorkLoop();

    expect(element.getBoundingClientRect().width).toBe(300);
  });

  it('supports LayoutAnimation.create() as the config', () => {
    const viewRef = createRef<HostInstance>();
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(renderBox(viewRef, 100));
    });
    const element = nullthrows(viewRef.current);

    Fantom.runTask(() => {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'linear', 'scaleXY'),
      );
      root.render(renderBox(viewRef, 250));
    });

    Fantom.unstable_produceFramesForDuration(200);
    Fantom.runWorkLoop();

    expect(element.getBoundingClientRect().width).toBe(250);
  });

  it('exposes the easeInEaseOut() shortcut', () => {
    const viewRef = createRef<HostInstance>();
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(renderBox(viewRef, 100));
    });
    const element = nullthrows(viewRef.current);

    Fantom.runTask(() => {
      LayoutAnimation.easeInEaseOut();
      root.render(renderBox(viewRef, 150));
    });

    Fantom.unstable_produceFramesForDuration(500);
    Fantom.runWorkLoop();

    expect(element.getBoundingClientRect().width).toBe(150);
  });
});
