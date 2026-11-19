/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
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
   * @deprecated Use `AnimatedFlatList` instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get FlatList(): AnimatedFlatList<> {
    return require('./components/AnimatedFlatList').default;
  },
  /**
   * @deprecated Use `AnimatedImage` instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get Image(): AnimatedImage {
    return require('./components/AnimatedImage').default;
  },
  /**
   * @deprecated Use `AnimatedScrollView` instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get ScrollView(): AnimatedScrollView {
    return require('./components/AnimatedScrollView').default;
  },
  /**
   * @deprecated Use `AnimatedSectionList` instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get SectionList(): AnimatedSectionList<> {
    return require('./components/AnimatedSectionList').default;
  },
  /**
   * @deprecated Use `AnimatedText` instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get Text(): AnimatedText {
    return require('./components/AnimatedText').default;
  },
  /**
   * @deprecated Use `AnimatedView` instead.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get View(): AnimatedView {
    return require('./components/AnimatedView').default;
  },
  ...Animated,
};
