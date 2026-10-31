/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PredictiveBackNativeEvent} from './PredictiveBackAnimatedViewNativeComponent';

import Animated from '../../Animated/Animated';
import PredictiveBackAnimatedViewNativeComponent from './PredictiveBackAnimatedViewNativeComponent';
import * as React from 'react';

/**
 * Hidden host view that emits predictive-back progress as a native event.
 *
 * Drive RN Animated with the native driver:
 *
 *   const progress = useAnimatedValue(0);
 *   <PredictiveBackAnimatedView
 *     onProgress={Animated.event(
 *       [{nativeEvent: {progress}}],
 *       {useNativeDriver: true},
 *     )}
 *   />
 *
 * Drive Reanimated with `useEvent` (no JS per frame):
 *
 *   const progress = useSharedValue(0);
 *   const onProgress = useEvent((e) => {
 *     'worklet';
 *     progress.value = e.progress;
 *   });
 *   <PredictiveBackAnimatedView onProgress={onProgress} />
 *
 * @see https://github.com/satya164/react-native-animated-observer
 * @platform android
 */
const NativeAnimatedView = Animated.createAnimatedComponent(
  PredictiveBackAnimatedViewNativeComponent,
);

export type {PredictiveBackNativeEvent};

function PredictiveBackAnimatedView(
  props: React.ElementConfig<typeof PredictiveBackAnimatedViewNativeComponent>,
): React.Node {
  return (
    <NativeAnimatedView collapsable={false} pointerEvents="none" {...props} />
  );
}

export default PredictiveBackAnimatedView;
