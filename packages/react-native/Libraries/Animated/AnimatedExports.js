/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// flowlint unsafe-getters-setters:off

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
   * @deprecated Use `AnimatedFlatList` instead.
   */
  get FlatList(): AnimatedFlatList<> {
    return require('./components/AnimatedFlatList').default;
  },
  /**
   * @deprecated Use `AnimatedImage` instead.
   */
  get Image(): AnimatedImage {
    return require('./components/AnimatedImage').default;
  },
  /**
   * @deprecated Use `AnimatedScrollView` instead.
   */
  get ScrollView(): AnimatedScrollView {
    return require('./components/AnimatedScrollView').default;
  },
  /**
   * @deprecated Use `AnimatedSectionList` instead.
   */
  get SectionList(): AnimatedSectionList<> {
    return require('./components/AnimatedSectionList').default;
  },
  /**
   * @deprecated Use `AnimatedText` instead.
   */
  get Text(): AnimatedText {
    return require('./components/AnimatedText').default;
  },
  /**
   * @deprecated Use `AnimatedView` instead.
   */
  get View(): AnimatedView {
    return require('./components/AnimatedView').default;
  },
  ...Animated,
};
