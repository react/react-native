/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {PointProp} from '../../StyleSheet/PointPropType';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {
  GestureResponderEvent,
  ScrollEvent,
} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

export type ScrollViewNativeProps = Readonly<{
  ...ViewProps,
  alwaysBounceHorizontal?: ?boolean,
  alwaysBounceVertical?: ?boolean,
  automaticallyAdjustContentInsets?: ?boolean,
  automaticallyAdjustKeyboardInsets?: ?boolean,
  automaticallyAdjustsScrollIndicatorInsets?: ?boolean,
  bounces?: ?boolean,
  bouncesZoom?: ?boolean,
  canCancelContentTouches?: ?boolean,
  centerContent?: ?boolean,
  contentInset?: ?EdgeInsetsProp,
  contentInsetAdjustmentBehavior?: ?(
    | 'automatic'
    | 'scrollableAxes'
    | 'never'
    | 'always'
  ),
  contentOffset?: ?PointProp,
  decelerationRate?: ?('fast' | 'normal' | number),
  directionalLockEnabled?: ?boolean,
  disableIntervalMomentum?: ?boolean,
  endFillColor?: ?ColorValue,
  fadingEdgeLength?: ?number | {start: number, end: number},
  indicatorStyle?: ?('default' | 'black' | 'white'),
  isInvertedVirtualizedList?: ?boolean,
  keyboardDismissMode?: ?('none' | 'on-drag' | 'interactive'),
  maintainVisibleContentPosition?: ?Readonly<{
    minIndexForVisible: number,
    autoscrollToTopThreshold?: ?number,
  }>,
  maximumZoomScale?: ?number,
  minimumZoomScale?: ?number,
  nestedScrollEnabled?: ?boolean,
  onMomentumScrollBegin?: ?(event: ScrollEvent) => void,
  onMomentumScrollEnd?: ?(event: ScrollEvent) => void,
  onScroll?: ?(event: ScrollEvent) => void,
  onScrollBeginDrag?: ?(event: ScrollEvent) => void,
  onScrollEndDrag?: ?(event: ScrollEvent) => void,
  onScrollToTop?: (event: ScrollEvent) => void,
  overScrollMode?: ?('auto' | 'always' | 'never'),
  pagingEnabled?: ?boolean,
  persistentScrollbar?: ?boolean,
  pinchGestureEnabled?: ?boolean,
  scrollEnabled?: ?boolean,
  scrollEventThrottle?: ?number,
  scrollIndicatorInsets?: ?EdgeInsetsProp,
  scrollPerfTag?: ?string,
  scrollToOverflowEnabled?: ?boolean,
  scrollsToTop?: ?boolean,
  scrollsChildToFocus?: ?boolean,
  sendMomentumEvents?: ?boolean,
  showsHorizontalScrollIndicator?: ?boolean,
  showsVerticalScrollIndicator?: ?boolean,
  snapToAlignment?: ?('start' | 'center' | 'end'),
  snapToEnd?: ?boolean,
  snapToInterval?: ?number,
  snapToOffsets?: ?ReadonlyArray<number>,
  snapToStart?: ?boolean,
  zoomScale?: ?number,
  // Overrides
  onResponderGrant?: ?(e: GestureResponderEvent) => void | boolean,
  ...
}>;
