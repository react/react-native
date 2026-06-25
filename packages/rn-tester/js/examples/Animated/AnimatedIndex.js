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

import ColorStylesExample from './ColorStylesExample';
import CombineExample from './CombineExample';
import ComposeAnimationsWithEasingExample from './ComposeAnimationsWithEasingExample';
import ComposingExample from './ComposingExample';
import ContinuousInteractionsExample from './ContinuousInteractionsExample';
import EasingExample from './EasingExample';
import FadeInViewExample from './FadeInViewExample';
import LoopingExample from './LoopingExample';
import MovingBoxExample from './MovingBoxExample';
import PanGestureExample from './PanGestureExample';
import PressabilityWithNativeDrivers from './PressabilityWithNativeDrivers';
import RotatingImagesExample from './RotatingImagesExample';
import TransformBounceExample from './TransformBounceExample';
import TransformStylesExample from './TransformStylesExample';

export default {
  framework: 'React',
  title: 'Animated',
  category: 'UI',
  documentationURL: 'https://reactnative.dev/docs/animated',
  description:
    'Library designed to make animations fluid, powerful, and painless to ' +
    'build and maintain.',
  showIndividualExamples: true,
  examples: [
    TransformStylesExample,
    ColorStylesExample,
    FadeInViewExample,
    ComposingExample,
    EasingExample,
    ComposeAnimationsWithEasingExample,
    RotatingImagesExample,
    MovingBoxExample,
    TransformBounceExample,
    LoopingExample,
    ContinuousInteractionsExample,
    CombineExample,
    PressabilityWithNativeDrivers,
    PanGestureExample,
  ],
} as RNTesterModule;
