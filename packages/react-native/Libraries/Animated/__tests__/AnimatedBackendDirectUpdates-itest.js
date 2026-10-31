/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags useSharedAnimatedBackend:true enableCxxAnimatedDirectPathInBackend:* updateRuntimeShadowNodeReferencesOnCommitThread:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef, useState} from 'react';
import {Animated, View, useAnimatedValue} from 'react-native';

let _opacity;
let _setAnimatedWidth;

// `still` has the same position and structure as `animated` but never
// animates, so it is cloned only for the reasons unrelated to animations.
function MyApp({
  animatedRef,
  stillRef,
}: {
  animatedRef: React.RefSetter<HostInstance>,
  stillRef?: React.RefSetter<HostInstance>,
}) {
  const opacity = useAnimatedValue(1);
  const stillOpacity = useAnimatedValue(1);
  const [animatedWidth, setAnimatedWidth] = useState(100);
  _opacity = opacity;
  _setAnimatedWidth = setAnimatedWidth;
  return (
    <View collapsable={false}>
      <Animated.View
        ref={animatedRef}
        style={{
          width: animatedWidth,
          height: 100,
          opacity,
        }}
      />
      <Animated.View
        ref={stillRef}
        style={{width: 100, height: 100, opacity: stillOpacity}}
      />
      <View collapsable={false} style={{width: 100, height: 100}} />
    </View>
  );
}

function startOpacityAnimation(duration: number) {
  Fantom.runTask(() => {
    Animated.timing(_opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  });
}

test('a React commit of the animated view keeps its direct animated value mounted', () => {
  const animatedRef = createRef<HostInstance>();
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp animatedRef={animatedRef} />);
  });

  startOpacityAnimation(1000);
  Fantom.unstable_produceFramesForDuration(500);

  Fantom.runTask(() => {
    _setAnimatedWidth(150);
  });

  expect(root.getRenderedOutput({props: ['opacity', 'width']}).toJSX()).toEqual(
    <rn-view>
      <rn-view key={0} opacity="0.5" width="150" />
      <rn-view key={1} width="100" />
      <rn-view key={2} width="100" />
    </rn-view>,
  );
});
