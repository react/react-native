/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModule} from '../../types/RNTesterTypes';

import AllAnimatedPropsExample from './AllAnimatedPropsExample';
import PlaygroundExample from './ChessboardExample';
import PerformanceTestExample from './PerformanceTestExample';
import SwipeableListExample from './SwipeableListExample';
import * as ReactNativeFeatureFlags from 'react-native/src/private/featureflags/ReactNativeFeatureFlags';

const canUseBackend =
  // eslint-disable-next-line
  ReactNativeFeatureFlags.useSharedAnimatedBackend() &&
  ReactNativeFeatureFlags.cxxNativeAnimatedEnabled();

export default {
  framework: 'React',
  title: 'Animation Backend',
  category: 'UI',
  description: `Examples demonstrating the Animation Backend for layout-updating animations. ${canUseBackend ? '' : 'You need to enable c++ Animated and the Animation Backend to see these examples.'}`,
  showIndividualExamples: true,
  examples: canUseBackend
    ? [
        AllAnimatedPropsExample,
        PlaygroundExample,
        SwipeableListExample,
        PerformanceTestExample,
      ]
    : [],
} as RNTesterModule;
