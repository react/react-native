/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import typeof AnimatedFlatList from './components/AnimatedFlatList';
import typeof AnimatedImage from './components/AnimatedImage';
import typeof AnimatedScrollView from './components/AnimatedScrollView';
import typeof AnimatedSectionList from './components/AnimatedSectionList';
import typeof AnimatedText from './components/AnimatedText';
import typeof AnimatedView from './components/AnimatedView';

import Platform from '../Utilities/Platform';
import AnimatedImplementation from './AnimatedImplementation';
import AnimatedMock from './AnimatedMock';

const Animated: typeof AnimatedImplementation = Platform.isDisableAnimations
  ? AnimatedMock
  : AnimatedImplementation;

export default {
  /**
   * FlatList and SectionList infer generic Type defined under their `data` and `section` props.
   */
  get FlatList(): AnimatedFlatList<any> {
    return require('./components/AnimatedFlatList').default;
  },
  /**
   * Animated variants of the basic native views. Accepts Animated.Value for
   * props and style.
   */
  get Image(): AnimatedImage {
    return require('./components/AnimatedImage').default;
  },
  /**
   * Animated variants of the basic native views. Accepts Animated.Value for
   * props and style.
   */
  get ScrollView(): AnimatedScrollView {
    return require('./components/AnimatedScrollView').default;
  },
  /**
   * FlatList and SectionList infer generic Type defined under their `data` and `section` props.
   */
  get SectionList(): AnimatedSectionList<any, any> {
    return require('./components/AnimatedSectionList').default;
  },
  /**
   * Animated variants of the basic native views. Accepts Animated.Value for
   * props and style.
   */
  get Text(): AnimatedText {
    return require('./components/AnimatedText').default;
  },
  /**
   * Animated variants of the basic native views. Accepts Animated.Value for
   * props and style.
   */
  get View(): AnimatedView {
    return require('./components/AnimatedView').default;
  },
  ...Animated,
};
