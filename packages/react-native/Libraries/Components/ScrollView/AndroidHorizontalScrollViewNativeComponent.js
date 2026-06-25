/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../../src/private/types/HostComponent';
import type {PartialViewConfig} from '../../Renderer/shims/ReactNativeTypes';
import type {ScrollViewNativeProps as Props} from './ScrollViewNativeComponentType';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import {colorAttribute} from '../View/ReactNativeStyleAttributes';

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'AndroidHorizontalScrollView',
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    decelerationRate: true,
    disableIntervalMomentum: true,
    maintainVisibleContentPosition: true,
    endFillColor: colorAttribute,
    fadingEdgeLength: true,
    nestedScrollEnabled: true,
    overScrollMode: true,
    pagingEnabled: true,
    persistentScrollbar: true,
    horizontal: true,
    scrollEnabled: true,
    scrollEventThrottle: true,
    scrollPerfTag: true,
    sendMomentumEvents: true,
    showsHorizontalScrollIndicator: true,
    snapToAlignment: true,
    snapToEnd: true,
    snapToInterval: true,
    snapToStart: true,
    snapToOffsets: true,
    contentOffset: true,
    borderBottomLeftRadius: true,
    borderBottomRightRadius: true,
    borderRadius: true,
    borderStyle: true,
    borderRightColor: colorAttribute,
    borderColor: colorAttribute,
    borderBottomColor: colorAttribute,
    borderTopLeftRadius: true,
    borderTopColor: colorAttribute,
    removeClippedSubviews: true,
    borderTopRightRadius: true,
    borderLeftColor: colorAttribute,
    pointerEvents: true,
    scrollsChildToFocus: true,
  },
};

const AndroidHorizontalScrollViewNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>(
    'AndroidHorizontalScrollView',
    () => __INTERNAL_VIEW_CONFIG,
  );

export default AndroidHorizontalScrollViewNativeComponent;
