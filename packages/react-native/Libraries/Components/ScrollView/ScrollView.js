/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../../../src/private/types/HostInstance';
import type {EdgeInsetsProp} from '../../StyleSheet/EdgeInsetsPropType';
import type {PointProp} from '../../StyleSheet/PointPropType';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {
  GestureResponderEvent,
  LayoutChangeEvent,
  ScrollEvent,
} from '../../Types/CoreEventTypes';
import type {EventSubscription} from '../../vendor/emitter/EventEmitter';
import type {KeyboardEvent, KeyboardMetrics} from '../Keyboard/Keyboard';
import type {ViewProps} from '../View/ViewPropTypes';
import type {ScrollViewStickyHeaderProps} from './ScrollViewStickyHeader';

import {
  HScrollContentViewNativeComponent,
  HScrollViewNativeComponent,
} from '../../../src/private/components/scrollview/HScrollViewNativeComponents';
import {
  VScrollContentViewNativeComponent,
  VScrollViewNativeComponent,
} from '../../../src/private/components/scrollview/VScrollViewNativeComponents';
import AnimatedImplementation from '../../Animated/AnimatedImplementation';
import FrameRateLogger from '../../Interaction/FrameRateLogger';
import {findNodeHandle} from '../../ReactNative/RendererProxy';
import UIManager from '../../ReactNative/UIManager';
import flattenStyle from '../../StyleSheet/flattenStyle';
import splitLayoutProps from '../../StyleSheet/splitLayoutProps';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Dimensions from '../../Utilities/Dimensions';
import dismissKeyboard from '../../Utilities/dismissKeyboard';
import Platform from '../../Utilities/Platform';
import Keyboard from '../Keyboard/Keyboard';
import TextInputState from '../TextInput/TextInputState';
import View from '../View/View';
import processDecelerationRate from './processDecelerationRate';
import Commands from './ScrollViewCommands';
import ScrollViewContext, {HORIZONTAL, VERTICAL} from './ScrollViewContext';
import ScrollViewStickyHeader from './ScrollViewStickyHeader';
import invariant from 'invariant';
import memoize from 'memoize-one';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {cloneElement} from 'react';

/*
 * iOS scroll event timing nuances:
 * ===============================
 *
 *
 * Scrolling without bouncing, if you touch down:
 * -------------------------------
 *
 * 1. `onMomentumScrollBegin` (when animation begins after letting up)
 *    ... physical touch starts ...
 * 2. `onTouchStartCapture`   (when you press down to stop the scroll)
 * 3. `onTouchStart`          (same, but bubble phase)
 * 4. `onResponderRelease`    (when lifting up - you could pause forever before * lifting)
 * 5. `onMomentumScrollEnd`
 *
 *
 * Scrolling with bouncing, if you touch down:
 * -------------------------------
 *
 * 1. `onMomentumScrollBegin` (when animation begins after letting up)
 *    ... bounce begins ...
 *    ... some time elapses ...
 *    ... physical touch during bounce ...
 * 2. `onMomentumScrollEnd`   (Makes no sense why this occurs first during bounce)
 * 3. `onTouchStartCapture`   (immediately after `onMomentumScrollEnd`)
 * 4. `onTouchStart`          (same, but bubble phase)
 * 5. `onTouchEnd`            (You could hold the touch start for a long time)
 * 6. `onMomentumScrollBegin` (When releasing the view starts bouncing back)
 *
 * So when we receive an `onTouchStart`, how can we tell if we are touching
 * *during* an animation (which then causes the animation to stop)? The only way
 * to tell is if the `touchStart` occurred immediately after the
 * `onMomentumScrollEnd`.
 *
 * This is abstracted out for you, so you can just call this.scrollResponderIsAnimating() if
 * necessary
 *
 * `ScrollView` also includes logic for blurring a currently focused input
 * if one is focused while scrolling. This is a natural place
 * to put this logic since it can support not dismissing the keyboard while
 * scrolling, unless a recognized "tap"-like gesture has occurred.
 *
 * The public lifecycle API includes events for keyboard interaction, responder
 * interaction, and scrolling (among others). The keyboard callbacks
 * `onKeyboardWill/Did/*` are *global* events, but are invoked on scroll
 * responder's props so that you can guarantee that the scroll responder's
 * internal state has been updated accordingly (and deterministically) by
 * the time the props callbacks are invoke. Otherwise, you would always wonder
 * if the scroll responder is currently in a state where it recognizes new
 * keyboard positions etc. If coordinating scrolling with keyboard movement,
 * *always* use these hooks instead of listening to your own global keyboard
 * events.
 *
 * Public keyboard lifecycle API: (props callbacks)
 *
 * Standard Keyboard Appearance Sequence:
 *
 *   this.props.onKeyboardWillShow
 *   this.props.onKeyboardDidShow
 *
 * `onScrollResponderKeyboardDismissed` will be invoked if an appropriate
 * tap inside the scroll responder's scrollable region was responsible
 * for the dismissal of the keyboard. There are other reasons why the
 * keyboard could be dismissed.
 *
 *   this.props.onScrollResponderKeyboardDismissed
 *
 * Standard Keyboard Hide Sequence:
 *
 *   this.props.onKeyboardWillHide
 *   this.props.onKeyboardDidHide
 */

export interface ScrollViewScrollToOptions {
  x?: number;
  y?: number;
  animated?: boolean;
}

// Public methods for ScrollView
export interface ScrollViewImperativeMethods {
  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  readonly getScrollResponder: () => ScrollResponderType;
  readonly getScrollableNode: () => ?number;
  readonly getInnerViewNode: () => ?number;
  readonly getInnerViewRef: () => InnerViewInstance | null;
  /**
   * Returns a reference to the underlying native scroll view, or null if the
   * native instance is not mounted.
   */
  readonly getNativeScrollRef: () => ScrollViewInstance | null;
  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   * Syntax:
   *
   * scrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  readonly scrollTo: (
    options?: ScrollViewScrollToOptions | number,
    deprecatedX?: number,
    deprecatedAnimated?: boolean,
  ) => void;
  /**
   * A helper function that scrolls to the end of the scrollview;
   * If this is a vertical ScrollView, it scrolls to the bottom.
   * If this is a horizontal ScrollView scrolls to the right.
   *
   * The options object has an animated prop, that enables the scrolling animation or not.
   * The animated prop defaults to true
   */
  readonly scrollToEnd: (options?: ?ScrollViewScrollToOptions) => void;
  /**
   * Displays the scroll indicators momentarily.
   */
  readonly flashScrollIndicators: () => void;
  readonly scrollResponderZoomTo: (
    rect: {
      x: number,
      y: number,
      width: number,
      height: number,
      animated?: boolean,
    },
    animated?: boolean, // deprecated, put this inside the rect argument instead
  ) => void;
  readonly scrollResponderScrollNativeHandleToKeyboard: (
    nodeHandle: number | HostInstance,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean,
  ) => void;
}

export type DecelerationRateType = 'fast' | 'normal' | number;
export type ScrollResponderType = ScrollViewImperativeMethods;

export interface ScrollViewInstance
  extends HostInstance,
    ScrollViewImperativeMethods {}

type InnerViewInstance = React.ElementRef<typeof View>;

export type ScrollViewPropsIOS = Readonly<{
  /**
   * Controls whether iOS should automatically adjust the content inset
   * for scroll views that are placed behind a navigation bar or
   * tab bar/toolbar.
   *
   * @default `true`
   * @platform ios
   */
  automaticallyAdjustContentInsets?: ?boolean,

  /**
   * Controls whether the ScrollView should automatically adjust its `contentInset`
   * and `scrollViewInsets` when the Keyboard changes its size.
   *
   * @default `false`
   * @platform ios
   */
  automaticallyAdjustKeyboardInsets?: ?boolean,
  /**
   * Controls whether iOS should automatically adjust the scroll indicator
   * insets. Available on iOS 13 and later.
   *
   * @default `true`
   * @platform ios
   */
  automaticallyAdjustsScrollIndicatorInsets?: ?boolean,
  /**
   * The amount by which the scroll view content is inset from the edges
   * of the scroll view.
   *
   * @default `{top: 0, left: 0, bottom: 0, right: 0}`
   * @platform ios
   */
  contentInset?: ?EdgeInsetsProp,
  /**
   * When true, the scroll view bounces when it reaches the end of the
   * content if the content is larger than the scroll view along the axis of
   * the scroll direction. When `false`, it disables all bouncing even if
   * the `alwaysBounce*` props are `true`.
   *
   * @default `true`
   * @platform ios
   */
  bounces?: ?boolean,
  /**
   * By default, ScrollView has an active pan responder that hijacks panresponders
   * deeper in the render tree in order to prevent accidental touches while scrolling.
   * However, in certain occasions (such as when using snapToInterval) in a vertical scrollview
   * You may want to disable this behavior in order to prevent the ScrollView from blocking touches
   */
  disableScrollViewPanResponder?: ?boolean,
  /**
   * When true, gestures can drive zoom past min/max and the zoom will animate
   * to the min/max value at gesture end, otherwise the zoom will not exceed
   * the limits.
   * @platform ios
   */
  bouncesZoom?: ?boolean,
  /**
   * When true, the scroll view bounces horizontally when it reaches the end
   * even if the content is smaller than the scroll view itself.
   *
   * @default {@platform horizontal} `true`
   * @platform ios
   */
  alwaysBounceHorizontal?: ?boolean,

  /**
   * When true, the scroll view bounces vertically when it reaches the end
   * even if the content is smaller than the scroll view itself.
   *
   * @default {@platform horizontal} `false`
   * @platform ios
   */
  alwaysBounceVertical?: ?boolean,

  /**
   * When true, the scroll view automatically centers the content when the
   * content is smaller than the scroll view bounds; when the content is
   * larger than the scroll view, this property has no effect.
   *
   * @default `false`
   * @platform ios
   */
  centerContent?: ?boolean,
  /**
   * The style of the scroll indicators.
   *
   *   - `'default'` (the default), same as `black`.
   *   - `'black'`, scroll indicator is black. This style is good against a light background.
   *   - `'white'`, scroll indicator is white. This style is good against a dark background.
   *
   * @platform ios
   */
  indicatorStyle?: ?('default' | 'black' | 'white'),
  /**
   * When true, the ScrollView will try to lock to only vertical or horizontal
   * scrolling while dragging.
   *
   * @default `false`
   * @platform ios
   */
  directionalLockEnabled?: ?boolean,

  /**
   * When false, once tracking starts, the scroll view will not try to drag
   * if the touch moves.
   *
   * @default `true`
   * @platform ios
   */
  canCancelContentTouches?: ?boolean,

  /**
   * The maximum allowed zoom scale.
   *
   * @default `1.0`
   * @platform ios
   */
  maximumZoomScale?: ?number,

  /**
   * The minimum allowed zoom scale.
   *
   * @default `1.0`
   * @platform ios
   */
  minimumZoomScale?: ?number,

  /**
   * When true, ScrollView allows use of pinch gestures to zoom in and out.
   *
   * @default `true`
   * @platform ios
   */
  pinchGestureEnabled?: ?boolean,
  /**
   * The amount by which the scroll view indicators are inset from the edges
   * of the scroll view. This should normally be set to the same value as
   * the `contentInset`.
   *
   * @default `{top: 0, left: 0, bottom: 0, right: 0}`
   * @platform ios
   */
  scrollIndicatorInsets?: ?EdgeInsetsProp,

  /**
   * When true, the scroll view can be programmatically scrolled beyond its
   * content size.
   *
   * @default `false`
   * @platform ios
   */
  scrollToOverflowEnabled?: ?boolean,

  /**
   * When true, the scroll view scrolls to top when the status bar is tapped.
   *
   * @default `true`
   * @platform ios
   */
  scrollsToTop?: ?boolean,
  /**
   * Fires when the scroll view scrolls to top after the status bar has been tapped
   * @platform ios
   */
  onScrollToTop?: (event: ScrollEvent) => void,
  /**
   * When true, shows a horizontal scroll indicator.
   *
   * @default `true`
   */
  showsHorizontalScrollIndicator?: ?boolean,

  /**
   * The current scale of the scroll view content.
   *
   * @default `1.0`
   * @platform ios
   */
  zoomScale?: ?number,
  /**
   * This property specifies how the safe area insets are used to modify the
   * content area of the scroll view.
   *
   * @default `'never'`
   * @platform ios
   */
  contentInsetAdjustmentBehavior?: ?(
    | 'automatic'
    | 'scrollableAxes'
    | 'never'
    | 'always'
  ),
}>;

export type ScrollViewPropsAndroid = Readonly<{
  /**
   * Enables nested scrolling for Android API level 21+. Nested scrolling is
   * supported by default on iOS.
   *
   * @default `false`
   * @platform android
   */
  nestedScrollEnabled?: ?boolean,
  /**
   * Sometimes a scrollview takes up more space than its content fills. When this is
   * the case, this prop will fill the rest of the scrollview with a color to avoid setting
   * a background and creating unnecessary overdraw. This is an advanced optimization
   * that is not needed in the general case.
   * @platform android
   */
  endFillColor?: ?ColorValue,
  /**
   * Tag used to log scroll performance on this scroll view. Will force
   * momentum events to be turned on (see sendMomentumEvents). This doesn't do
   * anything out of the box and you need to implement a custom native
   * FpsListener for it to be useful.
   * @platform android
   */
  scrollPerfTag?: ?string,
  /**
   * Used to override default value of overScroll mode.
   *
   * Possible values:
   *
   *  - `'auto'` - Default value, allow a user to over-scroll
   *    this view only if the content is large enough to meaningfully scroll.
   *  - `'always'` - Always allow a user to over-scroll this view.
   *  - `'never'` - Never allow a user to over-scroll this view.
   *
   * @platform android
   */
  overScrollMode?: ?('auto' | 'always' | 'never'),
  /**
   * Causes the scrollbars not to turn transparent when they are not in use.
   *
   * @default `false`
   * @platform android
   */
  persistentScrollbar?: ?boolean,
  /**
   * Controls the fading effect at the edges of the scroll content.
   *
   * A value greater than 0 will apply the fading effect, indicating more content is available
   * to scroll.
   *
   * You can specify a single number to apply the same fading length to both edges.
   * Alternatively, use an object with `start` and `end` properties to set different
   * fading lengths for the start and end of the scroll content.
   *
   * The default value is 0.
   *
   * @platform android
   */
  fadingEdgeLength?: ?number | {start: number, end: number},
  /**
   * When false, the ScrollView will not automatically scroll to a focused child when
   * the child requests focus. This can be useful when you want to control the scroll
   * position programmatically.
   *
   * @default `true`
   * @platform android
   */
  scrollsChildToFocus?: ?boolean,
}>;

type StickyHeaderComponentType = component(
  ref?: React.RefSetter<Readonly<interface {setNextHeaderY: number => void}>>,
  ...ScrollViewStickyHeaderProps
);

type ScrollViewBaseProps = Readonly<{
  /**
   * These styles will be applied to the scroll view content container which
   * wraps all of the child views.
   *
   * Example:
   *
   * ```tsx
   * return (
   *   <ScrollView contentContainerStyle={styles.contentContainer}>
   *   </ScrollView>
   * );
   * ...
   * const styles = StyleSheet.create({
   *   contentContainer: {
   *     paddingVertical: 20
   *   }
   * });
   * ```
   */
  contentContainerStyle?: ?ViewStyleProp,
  /**
   * Used to manually set the starting scroll offset.
   *
   * @default `{x: 0, y: 0}`
   */
  contentOffset?: ?PointProp,

  /**
   * When true, the scroll view stops on the next index (in relation to scroll
   * position at release) regardless of how fast the gesture is. This can be
   * used for pagination when the page is less than the width of the
   * horizontal ScrollView or the height of the vertical ScrollView.
   *
   * @default `false`
   */
  disableIntervalMomentum?: ?boolean,
  /**
   * A floating-point number that determines how quickly the scroll view
   * decelerates after the user lifts their finger. You may also use string
   * shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
   * for `UIScrollViewDecelerationRateNormal` and
   * `UIScrollViewDecelerationRateFast` respectively.
   *
   *   - `'normal'`: 0.998 on iOS, 0.985 on Android
   *   - `'fast'`: 0.99 on iOS, 0.9 on Android
   *
   * @default `'normal'`
   */
  decelerationRate?: ?DecelerationRateType,

  /**
   * *Experimental, iOS Only*. The API is experimental and will change in future releases.
   *
   * Controls how much distance is traveled after user stops scrolling.
   * A value greater than 1 will increase the distance traveled.
   * A value less than 1 will decrease the distance traveled.
   *
   * @deprecated
   *
   * @default `1`
   */
  experimental_endDraggingSensitivityMultiplier?: ?number,

  /**
   * When true, the scroll view's children are arranged horizontally in a row
   * instead of vertically in a column.
   *
   * @default `false`
   */
  horizontal?: ?boolean,
  /**
   * If sticky headers should stick at the bottom instead of the top of the
   * ScrollView. This is usually used with inverted ScrollViews.
   */
  invertStickyHeaders?: ?boolean,
  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *
   * *Cross platform*
   *
   *   - `'none'`, drags do not dismiss the keyboard.
   *   - `'on-drag'`, the keyboard is dismissed when a drag begins.
   *
   * *iOS Only*
   *
   *   - `'interactive'`, the keyboard is dismissed interactively with the drag and moves in
   *     synchrony with the touch; dragging upwards cancels the dismissal.
   *     On Android this is not supported and it will have the same behavior as `'none'`.
   *
   * @default `'none'`
   */
  keyboardDismissMode?: ?// default
  // cross-platform
  ('none' | 'on-drag' | 'interactive'), // ios only
  /**
   * Determines when the keyboard should stay visible after a tap.
   *
   *   - `'never'`, tapping outside of the focused text input when the keyboard
   *     is up dismisses the keyboard. When this happens, children will not receive the tap.
   *   - `'always'`, the keyboard will not dismiss automatically, and the scroll view will not
   *     catch taps, but children of the scroll view can catch taps.
   *   - `'handled'`, the keyboard will not dismiss automatically when the tap was handled by
   *     children, (or captured by an ancestor).
   *   - `false`, deprecated, use `'never'` instead.
   *   - `true`, deprecated, use `'always'` instead.
   *
   * @default `'never'`
   */
  keyboardShouldPersistTaps?: ?('always' | 'never' | 'handled' | true | false),
  /**
   * When set, the scroll view will adjust the scroll position so that the first child that is
   * partially or fully visible and at or beyond `minIndexForVisible` will not change position.
   * This is useful for lists that are loading content in both directions, e.g. a chat thread,
   * where new messages coming in might otherwise cause the scroll position to jump. A value of 0
   * is common, but other values such as 1 can be used to skip loading spinners or other content
   * that should not maintain position.
   *
   * The optional `autoscrollToTopThreshold` can be used to make the content automatically scroll
   * to the top after making the adjustment if the user was within the threshold of the top before
   * the adjustment was made. This is also useful for chat-like applications where you want to see
   * new messages scroll into place, but not if the user has scrolled up a ways and it would be
   * disruptive to scroll a bunch.
   *
   * Caveat 1: Reordering elements in the scrollview with this enabled will probably cause
   * jumpiness and jank. It can be fixed, but there are currently no plans to do so. For now,
   * don't re-order the content of any ScrollViews or Lists that use this feature.
   *
   * Caveat 2: This simply uses `contentOffset` and `frame.origin` in native code to compute
   * visibility. Occlusion, transforms, and other complexity won't be taken into account as to
   * whether content is "visible" or not.
   *
   */
  maintainVisibleContentPosition?: ?Readonly<{
    minIndexForVisible: number,
    autoscrollToTopThreshold?: ?number,
  }>,
  /**
   * Called when the momentum scroll starts (scroll which occurs as the ScrollView glides to a stop).
   */
  onMomentumScrollBegin?: ?(event: ScrollEvent) => void,
  /**
   * Called when the momentum scroll ends (scroll which occurs as the ScrollView glides to a stop).
   */
  onMomentumScrollEnd?: ?(event: ScrollEvent) => void,

  /**
   * Fires at most once per frame during scrolling.
   */
  onScroll?: ?(event: ScrollEvent) => void,
  /**
   * Called when the user begins to drag the scroll view.
   */
  onScrollBeginDrag?: ?(event: ScrollEvent) => void,
  /**
   * Called when the user stops dragging the scroll view and it either stops
   * or begins to glide.
   */
  onScrollEndDrag?: ?(event: ScrollEvent) => void,
  /**
   * Called when scrollable content view of the ScrollView changes.
   *
   * Handler function is passed the content width and content height as parameters:
   * `(contentWidth, contentHeight)`
   *
   * It's implemented using onLayout handler attached to the content container
   * which this ScrollView renders.
   */
  onContentSizeChange?: (contentWidth: number, contentHeight: number) => void,
  onKeyboardDidShow?: (event: KeyboardEvent) => void,
  onKeyboardDidHide?: (event: KeyboardEvent) => void,
  onKeyboardWillShow?: (event: KeyboardEvent) => void,
  onKeyboardWillHide?: (event: KeyboardEvent) => void,
  /**
   * When true, the scroll view stops on multiples of the scroll view's size
   * when scrolling. This can be used for horizontal pagination.
   *
   * @default `false`
   */
  pagingEnabled?: ?boolean,

  /**
   * When false, the view cannot be scrolled via touch interaction.
   * Note that the view can always be scrolled by calling `scrollTo`.
   *
   * @default `true`
   */
  scrollEnabled?: ?boolean,

  /**
   * Limits how often scroll events will be fired while scrolling, specified as
   * a time interval in ms. This may be useful when expensive work is performed
   * in response to scrolling. Values <= `16` will disable throttling,
   * regardless of the refresh rate of the device.
   *
   * @default `0`
   */
  scrollEventThrottle?: ?number,

  /**
   * When true, shows a vertical scroll indicator.
   *
   * @default `true`
   */
  showsVerticalScrollIndicator?: ?boolean,

  /**
   * When true, the sticky header is hidden when scrolling down, and docks
   * at the top when scrolling up.
   *
   * @default `false`
   */
  stickyHeaderHiddenOnScroll?: ?boolean,
  /**
   * An array of child indices determining which children get docked to the
   * top of the screen when scrolling. For example, passing
   * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
   * top of the scroll view. This property is not supported in conjunction
   * with `horizontal={true}`.
   */
  stickyHeaderIndices?: ?ReadonlyArray<number>,
  /**
   * A React Component that will be used to render sticky headers.
   * To be used together with `stickyHeaderIndices` or with `SectionList`, defaults to `ScrollViewStickyHeader`.
   * You may need to set this if your sticky header uses custom transforms (eg. translation),
   * for example when you want your list to have an animated hidable header.
   */
  StickyHeaderComponent?: StickyHeaderComponentType,
  /**
   * When `snapToInterval` is set, `snapToAlignment` defines the relationship
   * of the snapping to the scroll view.
   *
   *   - `'start'`, aligns the snap at the left (horizontal) or top (vertical).
   *   - `'center'`, aligns the snap in the center.
   *   - `'end'`, aligns the snap at the right (horizontal) or bottom (vertical).
   *
   * @default `'start'`
   */
  snapToAlignment?: ?('start' | 'center' | 'end'),
  /**
   * When set, causes the scroll view to stop at multiples of the value of
   * `snapToInterval`. This can be used for paginating through children
   * that have lengths smaller than the scroll view. Typically used in
   * combination with `snapToAlignment` and `decelerationRate="fast"`.
   *
   * Overrides less configurable `pagingEnabled` prop.
   */
  snapToInterval?: ?number,
  /**
   * When set, causes the scroll view to stop at the defined offsets.
   * This can be used for paginating through variously sized children
   * that have lengths smaller than the scroll view. Typically used in
   * combination with `decelerationRate="fast"`.
   *
   * Overrides less configurable `pagingEnabled` and `snapToInterval` props.
   */
  snapToOffsets?: ?ReadonlyArray<number>,
  /**
   * Use in conjunction with `snapToOffsets`. By default, the beginning
   * of the list counts as a snap offset. Set `snapToStart` to `false` to disable
   * this behavior and allow the list to scroll freely between its start and
   * the first `snapToOffsets` offset.
   *
   * @default `true`
   */
  snapToStart?: ?boolean,

  /**
   * Use in conjunction with `snapToOffsets`. By default, the end
   * of the list counts as a snap offset. Set `snapToEnd` to `false` to disable
   * this behavior and allow the list to scroll freely between its end and
   * the last `snapToOffsets` offset.
   *
   * @default `true`
   */
  snapToEnd?: ?boolean,

  /**
   * Experimental: When true, offscreen child views (whose `overflow` value is
   * `hidden`) are removed from their native backing superview when offscreen.
   * This can improve scrolling performance on long lists.
   *
   * @default `true`
   */
  removeClippedSubviews?: ?boolean,
  /**
   * A RefreshControl component, used to provide pull-to-refresh
   * functionality for the ScrollView. Only works for vertical ScrollViews
   * (`horizontal` prop must be `false`).
   *
   * See [RefreshControl](docs/refreshcontrol.html).
   */
  /* $FlowFixMe[unclear-type] - how to handle generic type without existential
   * operator? */
  refreshControl?: ?React.MixedElement,
  children?: React.Node,
  /**
   * A ref to the inner View element of the ScrollView. This should be used
   * instead of calling `getInnerViewRef`.
   */
  innerViewRef?: React.RefSetter<InnerViewInstance>,
  /**
   * A ref to the Native ScrollView component. This ref can be used to call
   * all of ScrollView's public methods, in addition to native methods like
   * measure, measureLayout, etc.
   */
  scrollViewRef?: React.RefSetter<ScrollViewInstance>,
}>;

/** @build-types emit-as-interface Nativewind compatibility */
export type ScrollViewProps = Readonly<{
  ...Omit<ViewProps, 'experimental_accessibilityOrder'>,
  ...ScrollViewPropsIOS,
  ...ScrollViewPropsAndroid,
  ...ScrollViewBaseProps,
}>;

type ScrollViewState = {
  layoutHeight: ?number,
};

const IS_ANIMATING_TOUCH_START_THRESHOLD_MS = 16;

export type ScrollViewComponentStatics = Readonly<{
  Context: typeof ScrollViewContext,
}>;

/**
 * Component that wraps platform ScrollView while providing
 * integration with touch locking "responder" system.
 *
 * Keep in mind that ScrollViews must have a bounded height in order to work,
 * since they contain unbounded-height children into a bounded container (via
 * a scroll interaction). In order to bound the height of a ScrollView, either
 * set the height of the view directly (discouraged) or make sure all parent
 * views have bounded height. Forgetting to transfer `{flex: 1}` down the
 * view stack can lead to errors here, which the element inspector makes
 * easy to debug.
 *
 * Doesn't yet support other contained responders from blocking this scroll
 * view from becoming the responder.
 *
 *
 * `<ScrollView>` vs [`<FlatList>`](https://reactnative.dev/docs/flatlist) - which one to use?
 *
 * `ScrollView` simply renders all its react child components at once. That
 * makes it very easy to understand and use.
 *
 * On the other hand, this has a performance downside. Imagine you have a very
 * long list of items you want to display, maybe several screens worth of
 * content. Creating JS components and native views for everything all at once,
 * much of which may not even be shown, will contribute to slow rendering and
 * increased memory usage.
 *
 * This is where `FlatList` comes into play. `FlatList` renders items lazily,
 * just when they are about to appear, and removes items that scroll way off
 * screen to save memory and processing time.
 *
 * `FlatList` is also handy if you want to render separators between your items,
 * multiple columns, infinite scroll loading, or any number of other features it
 * supports out of the box.
 *
 * @see https://reactnative.dev/docs/scrollview
 */
class ScrollView extends React.Component<ScrollViewProps, ScrollViewState> {
  static Context: typeof ScrollViewContext = ScrollViewContext;

  constructor(props: ScrollViewProps) {
    super(props);

    this._scrollAnimatedValue = new AnimatedImplementation.Value(
      this.props.contentOffset?.y ?? 0,
    );
    this._scrollAnimatedValue.setOffset(this.props.contentInset?.top ?? 0);
  }

  _scrollAnimatedValue: AnimatedImplementation.Value;
  _scrollAnimatedValueAttachment: ?{detach: () => void, ...} = null;
  _stickyHeaderRefs: Map<
    React.Key,
    React.ElementRef<StickyHeaderComponentType>,
  > = new Map();
  _headerLayoutYs: Map<React.Key, number> = new Map();

  _keyboardMetrics: ?KeyboardMetrics = null;
  _additionalScrollOffset: number = 0;
  _isTouching: boolean = false;
  _lastMomentumScrollBeginTime: number = 0;
  _lastMomentumScrollEndTime: number = 0;

  // Reset to false every time becomes responder. This is used to:
  // - Determine if the scroll view has been scrolled and therefore should
  // refuse to give up its responder lock.
  // - Determine if releasing should dismiss the keyboard when we are in
  // tap-to-dismiss mode (this.props.keyboardShouldPersistTaps !== 'always').
  _observedScrollSinceBecomingResponder: boolean = false;
  _becameResponderWhileAnimating: boolean = false;
  _preventNegativeScrollOffset: ?boolean = null;

  _animated: ?boolean = null;

  _subscriptionKeyboardWillShow: ?EventSubscription = null;
  _subscriptionKeyboardWillHide: ?EventSubscription = null;
  _subscriptionKeyboardDidShow: ?EventSubscription = null;
  _subscriptionKeyboardDidHide: ?EventSubscription = null;

  state: ScrollViewState = {
    layoutHeight: null,
  };

  componentDidMount() {
    if (typeof this.props.keyboardShouldPersistTaps === 'boolean') {
      console.warn(
        `'keyboardShouldPersistTaps={${
          this.props.keyboardShouldPersistTaps === true ? 'true' : 'false'
        }}' is deprecated. ` +
          `Use 'keyboardShouldPersistTaps="${
            this.props.keyboardShouldPersistTaps ? 'always' : 'never'
          }"' instead`,
      );
    }

    this._keyboardMetrics = Keyboard.metrics();
    this._additionalScrollOffset = 0;

    this._subscriptionKeyboardWillShow = Keyboard.addListener(
      'keyboardWillShow',
      this.scrollResponderKeyboardWillShow,
    );
    this._subscriptionKeyboardWillHide = Keyboard.addListener(
      'keyboardWillHide',
      this.scrollResponderKeyboardWillHide,
    );
    this._subscriptionKeyboardDidShow = Keyboard.addListener(
      'keyboardDidShow',
      this.scrollResponderKeyboardDidShow,
    );
    this._subscriptionKeyboardDidHide = Keyboard.addListener(
      'keyboardDidHide',
      this.scrollResponderKeyboardDidHide,
    );

    this._updateAnimatedNodeAttachment();
  }

  componentDidUpdate(prevProps: ScrollViewProps) {
    const prevContentInsetTop = prevProps.contentInset
      ? prevProps.contentInset.top
      : 0;
    const newContentInsetTop = this.props.contentInset
      ? this.props.contentInset.top
      : 0;
    if (prevContentInsetTop !== newContentInsetTop) {
      this._scrollAnimatedValue.setOffset(newContentInsetTop || 0);
    }

    this._updateAnimatedNodeAttachment();
  }

  componentWillUnmount() {
    if (this._subscriptionKeyboardWillShow != null) {
      this._subscriptionKeyboardWillShow.remove();
    }
    if (this._subscriptionKeyboardWillHide != null) {
      this._subscriptionKeyboardWillHide.remove();
    }
    if (this._subscriptionKeyboardDidShow != null) {
      this._subscriptionKeyboardDidShow.remove();
    }
    if (this._subscriptionKeyboardDidHide != null) {
      this._subscriptionKeyboardDidHide.remove();
    }

    if (this._scrollAnimatedValueAttachment) {
      this._scrollAnimatedValueAttachment.detach();
    }
  }

  /**
   * Returns a reference to the underlying scroll responder, which supports
   * operations like `scrollTo`. All ScrollView-like components should
   * implement this method so that they can be composed while providing access
   * to the underlying scroll responder's methods.
   */
  getScrollResponder: ScrollViewImperativeMethods['getScrollResponder'] =
    () => {
      // $FlowFixMe[unclear-type]
      return this as any as ScrollResponderType;
    };

  getScrollableNode: ScrollViewImperativeMethods['getScrollableNode'] = () => {
    return findNodeHandle<$FlowFixMe>(this.getNativeScrollRef());
  };

  getInnerViewNode: ScrollViewImperativeMethods['getInnerViewNode'] = () => {
    return findNodeHandle<$FlowFixMe>(this._innerView.nativeInstance);
  };

  getInnerViewRef: ScrollViewImperativeMethods['getInnerViewRef'] = () => {
    return this._innerView.nativeInstance;
  };

  getNativeScrollRef: ScrollViewImperativeMethods['getNativeScrollRef'] =
    () => {
      // Object.assign in _scrollView's mutator augments nativeInstance in place,
      // so it is already a ScrollViewInstance at runtime.
      // $FlowFixMe[incompatible-type]
      return this._scrollView.nativeInstance;
    };

  /**
   * Scrolls to a given x, y offset, either immediately or with a smooth animation.
   *
   * Example:
   *
   * `scrollTo({x: 0, y: 0, animated: true})`
   *
   * Note: The weird function signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollTo: ScrollViewImperativeMethods['scrollTo'] = (
    options,
    deprecatedX,
    deprecatedAnimated,
  ) => {
    let x, y, animated;
    if (typeof options === 'number') {
      console.warn(
        '`scrollTo(y, x, animated)` is deprecated. Use `scrollTo({x: 5, y: 5, ' +
          'animated: true})` instead.',
      );
      y = options;
      x = deprecatedX;
      animated = deprecatedAnimated;
    } else if (options) {
      y = options.y;
      x = options.x;
      animated = options.animated;
    }
    const component = this.getNativeScrollRef();
    if (component == null) {
      return;
    }
    Commands.scrollTo(component, x || 0, y || 0, animated !== false);
  };

  /**
   * If this is a vertical ScrollView scrolls to the bottom.
   * If this is a horizontal ScrollView scrolls to the right.
   *
   * Use `scrollToEnd({animated: true})` for smooth animated scrolling,
   * `scrollToEnd({animated: false})` for immediate scrolling.
   * If no options are passed, `animated` defaults to true.
   */
  scrollToEnd: ScrollViewImperativeMethods['scrollToEnd'] = options => {
    // Default to true
    const animated = (options && options.animated) !== false;
    const component = this.getNativeScrollRef();
    if (component == null) {
      return;
    }
    Commands.scrollToEnd(component, animated);
  };

  /**
   * Displays the scroll indicators momentarily.
   *
   * @platform ios
   */
  flashScrollIndicators: ScrollViewImperativeMethods['flashScrollIndicators'] =
    () => {
      const component = this.getNativeScrollRef();
      if (component == null) {
        return;
      }
      Commands.flashScrollIndicators(component);
    };

  /**
   * This method should be used as the callback to onFocus in a TextInputs'
   * parent view. Note that any module using this mixin needs to return
   * the parent view's ref in getScrollViewRef() in order to use this method.
   * @param {number} nodeHandle The TextInput node handle
   * @param {number} additionalOffset The scroll view's bottom "contentInset".
   *        Default is 0.
   * @param {bool} preventNegativeScrolling Whether to allow pulling the content
   *        down to make it meet the keyboard's top. Default is false.
   */
  scrollResponderScrollNativeHandleToKeyboard: ScrollViewImperativeMethods['scrollResponderScrollNativeHandleToKeyboard'] =
    (
      nodeHandle: number | HostInstance,
      additionalOffset?: number,
      preventNegativeScrollOffset?: boolean,
    ) => {
      this._additionalScrollOffset = additionalOffset || 0;
      this._preventNegativeScrollOffset = !!preventNegativeScrollOffset;

      if (this._innerView.nativeInstance == null) {
        return;
      }

      if (typeof nodeHandle === 'number') {
        UIManager.measureLayout(
          nodeHandle,
          nullthrows(findNodeHandle<$FlowFixMe>(this)),
          // $FlowFixMe[method-unbinding] added when improving typing for this parameters
          this._textInputFocusError,
          this._inputMeasureAndScrollToKeyboard,
        );
      } else {
        nodeHandle.measureLayout(
          this._innerView.nativeInstance,
          this._inputMeasureAndScrollToKeyboard,
          // $FlowFixMe[method-unbinding] added when improving typing for this parameters
          this._textInputFocusError,
        );
      }
    };

  /**
   * A helper function to zoom to a specific rect in the scrollview. The argument has the shape
   * {x: number; y: number; width: number; height: number; animated: boolean = true}
   *
   * @platform ios
   */
  scrollResponderZoomTo: ScrollViewImperativeMethods['scrollResponderZoomTo'] =
    (
      rect: {
        x: number,
        y: number,
        width: number,
        height: number,
        animated?: boolean,
      },
      animated?: boolean, // deprecated, put this inside the rect argument instead
    ) => {
      invariant(Platform.OS === 'ios', 'zoomToRect is not implemented');
      if ('animated' in rect) {
        this._animated = rect.animated;
        delete rect.animated;
      } else if (typeof animated !== 'undefined') {
        console.warn(
          '`scrollResponderZoomTo` `animated` argument is deprecated. Use `options.animated` instead',
        );
      }

      const component = this.getNativeScrollRef();
      if (component == null) {
        return;
      }
      Commands.zoomToRect(component, rect, animated !== false);
    };

  _textInputFocusError() {
    console.warn('Error measuring text field.');
  }

  /**
   * The calculations performed here assume the scroll view takes up the entire
   * screen - even if has some content inset. We then measure the offsets of the
   * keyboard, and compensate both for the scroll view's "contentInset".
   *
   * @param {number} left Position of input w.r.t. table view.
   * @param {number} top Position of input w.r.t. table view.
   * @param {number} width Width of the text input.
   * @param {number} height Height of the text input.
   */
  _inputMeasureAndScrollToKeyboard: (
    left: number,
    top: number,
    width: number,
    height: number,
  ) => void = (left: number, top: number, width: number, height: number) => {
    let keyboardScreenY = Dimensions.get('window').height;

    const scrollTextInputIntoVisibleRect = () => {
      if (this._keyboardMetrics != null) {
        keyboardScreenY = this._keyboardMetrics.screenY;
      }
      let scrollOffsetY =
        top - keyboardScreenY + height + this._additionalScrollOffset;

      // By default, this can scroll with negative offset, pulling the content
      // down so that the target component's bottom meets the keyboard's top.
      // If requested otherwise, cap the offset at 0 minimum to avoid content
      // shifting down.
      if (this._preventNegativeScrollOffset === true) {
        scrollOffsetY = Math.max(0, scrollOffsetY);
      }
      this.scrollTo({x: 0, y: scrollOffsetY, animated: true});

      this._additionalScrollOffset = 0;
      this._preventNegativeScrollOffset = false;
    };

    if (this._keyboardMetrics == null) {
      // `_keyboardMetrics` is set inside `scrollResponderKeyboardWillShow` which
      // is not guaranteed to be called before `_inputMeasureAndScrollToKeyboard` but native has already scheduled it.
      // In case it was not called before `_inputMeasureAndScrollToKeyboard`, we postpone scrolling to
      // text input.
      setTimeout(() => {
        scrollTextInputIntoVisibleRect();
      }, 0);
    } else {
      scrollTextInputIntoVisibleRect();
    }
  };

  _getKeyForIndex(
    index: number,
    // $FlowFixMe[unclear-type] - The children and its key is unknown.
    childArray: any,
  ): React.Key {
    const child = childArray[index];
    return child && child.key;
  }

  _updateAnimatedNodeAttachment() {
    if (this._scrollAnimatedValueAttachment) {
      this._scrollAnimatedValueAttachment.detach();
    }
    if (
      this.props.stickyHeaderIndices &&
      this.props.stickyHeaderIndices.length > 0
    ) {
      this._scrollAnimatedValueAttachment =
        AnimatedImplementation.attachNativeEvent(
          this.getNativeScrollRef(),
          'onScroll',
          [{nativeEvent: {contentOffset: {y: this._scrollAnimatedValue}}}],
        );
    }
  }

  _setStickyHeaderRef(
    key: string,
    ref: ?React.ElementRef<StickyHeaderComponentType>,
  ) {
    if (ref) {
      this._stickyHeaderRefs.set(key, ref);
    } else {
      this._stickyHeaderRefs.delete(key);
    }
  }

  _onStickyHeaderLayout(
    index: number,
    event: LayoutChangeEvent,
    key: React.Key,
  ) {
    const {stickyHeaderIndices} = this.props;
    if (!stickyHeaderIndices) {
      return;
    }
    const childArray = React.Children.toArray<$FlowFixMe>(this.props.children);
    if (key !== this._getKeyForIndex(index, childArray)) {
      // ignore stale layout update
      return;
    }

    const layoutY = event.nativeEvent.layout.y;
    this._headerLayoutYs.set(key, layoutY);

    const indexOfIndex = stickyHeaderIndices.indexOf(index);
    const previousHeaderIndex = stickyHeaderIndices[indexOfIndex - 1];
    if (previousHeaderIndex != null) {
      const previousHeader = this._stickyHeaderRefs.get(
        this._getKeyForIndex(previousHeaderIndex, childArray),
      );
      previousHeader &&
        previousHeader.setNextHeaderY &&
        previousHeader.setNextHeaderY(layoutY);
    }
  }

  _handleScroll = (e: ScrollEvent) => {
    this._observedScrollSinceBecomingResponder = true;
    this.props.onScroll && this.props.onScroll(e);
  };

  _handleLayout = (e: LayoutChangeEvent) => {
    if (this.props.invertStickyHeaders === true) {
      this.setState({layoutHeight: e.nativeEvent.layout.height});
    }
    if (this.props.onLayout) {
      this.props.onLayout(e);
    }
  };

  _handleContentOnLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    this.props.onContentSizeChange &&
      this.props.onContentSizeChange(width, height);
  };

  _innerView: RefForwarder<InnerViewInstance, InnerViewInstance> =
    createRefForwarder(
      (instance: InnerViewInstance): InnerViewInstance => instance,
    );

  _scrollView: RefForwarder<HostInstance, ScrollViewInstance | null> =
    createRefForwarder(nativeInstance => {
      // This is a hack. Ideally we would forwardRef  to the underlying
      // host component. However, since ScrollView has it's own methods that can be
      // called as well, if we used the standard forwardRef then these
      // methods wouldn't be accessible and thus be a breaking change.
      //
      // Therefore we edit ref to include ScrollView's public methods so that
      // they are callable from the ref.

      // $FlowFixMe[prop-missing] - Known issue with appending custom methods.
      // $FlowFixMe[incompatible-type]
      // $FlowFixMe[unsafe-object-assign]
      const publicInstance: ScrollViewInstance = Object.assign(nativeInstance, {
        getScrollResponder: this.getScrollResponder,
        getScrollableNode: this.getScrollableNode,
        getInnerViewNode: this.getInnerViewNode,
        getInnerViewRef: this.getInnerViewRef,
        getNativeScrollRef: this.getNativeScrollRef,
        scrollTo: this.scrollTo,
        scrollToEnd: this.scrollToEnd,
        flashScrollIndicators: this.flashScrollIndicators,
        scrollResponderZoomTo: this.scrollResponderZoomTo,
        scrollResponderScrollNativeHandleToKeyboard:
          this.scrollResponderScrollNativeHandleToKeyboard,
      });

      return publicInstance;
    });

  /**
   * Warning, this may be called several times for a single keyboard opening.
   * It's best to store the information in this method and then take any action
   * at a later point (either in `keyboardDidShow` or other).
   *
   * Here's the order that events occur in:
   * - focus
   * - willShow {startCoordinates, endCoordinates} several times
   * - didShow several times
   * - blur
   * - willHide {startCoordinates, endCoordinates} several times
   * - didHide several times
   *
   * The `ScrollResponder` module callbacks for each of these events.
   * Even though any user could have easily listened to keyboard events
   * themselves, using these `props` callbacks ensures that ordering of events
   * is consistent - and not dependent on the order that the keyboard events are
   * subscribed to. This matters when telling the scroll view to scroll to where
   * the keyboard is headed - the scroll responder better have been notified of
   * the keyboard destination before being instructed to scroll to where the
   * keyboard will be. Stick to the `ScrollResponder` callbacks, and everything
   * will work.
   *
   * WARNING: These callbacks will fire even if a keyboard is displayed in a
   * different navigation pane. Filter out the events to determine if they are
   * relevant to you. (For example, only if you receive these callbacks after
   * you had explicitly focused a node etc).
   */

  scrollResponderKeyboardWillShow: (e: KeyboardEvent) => void = (
    e: KeyboardEvent,
  ) => {
    this._keyboardMetrics = e.endCoordinates;
    this.props.onKeyboardWillShow && this.props.onKeyboardWillShow(e);
  };

  scrollResponderKeyboardWillHide: (e: KeyboardEvent) => void = (
    e: KeyboardEvent,
  ) => {
    this._keyboardMetrics = null;
    this.props.onKeyboardWillHide && this.props.onKeyboardWillHide(e);
  };

  scrollResponderKeyboardDidShow: (e: KeyboardEvent) => void = (
    e: KeyboardEvent,
  ) => {
    this._keyboardMetrics = e.endCoordinates;
    this.props.onKeyboardDidShow && this.props.onKeyboardDidShow(e);
  };

  scrollResponderKeyboardDidHide: (e: KeyboardEvent) => void = (
    e: KeyboardEvent,
  ) => {
    this._keyboardMetrics = null;
    this.props.onKeyboardDidHide && this.props.onKeyboardDidHide(e);
  };

  /**
   * Invoke this from an `onMomentumScrollBegin` event.
   */
  _handleMomentumScrollBegin: (e: ScrollEvent) => void = (e: ScrollEvent) => {
    this._lastMomentumScrollBeginTime = global.performance.now();
    this.props.onMomentumScrollBegin && this.props.onMomentumScrollBegin(e);
  };

  /**
   * Invoke this from an `onMomentumScrollEnd` event.
   */
  _handleMomentumScrollEnd: (e: ScrollEvent) => void = (e: ScrollEvent) => {
    FrameRateLogger.endScroll();
    this._lastMomentumScrollEndTime = global.performance.now();
    this.props.onMomentumScrollEnd && this.props.onMomentumScrollEnd(e);
  };

  /**
   * Unfortunately, `onScrollBeginDrag` also fires when *stopping* the scroll
   * animation, and there's not an easy way to distinguish a drag vs. stopping
   * momentum.
   *
   * Invoke this from an `onScrollBeginDrag` event.
   */
  _handleScrollBeginDrag: (e: ScrollEvent) => void = (e: ScrollEvent) => {
    FrameRateLogger.beginScroll(); // TODO: track all scrolls after implementing onScrollEndAnimation

    if (
      Platform.OS === 'android' &&
      this.props.keyboardDismissMode === 'on-drag'
    ) {
      dismissKeyboard();
    }

    this.props.onScrollBeginDrag && this.props.onScrollBeginDrag(e);
  };

  /**
   * Invoke this from an `onScrollEndDrag` event.
   */
  _handleScrollEndDrag: (e: ScrollEvent) => void = (e: ScrollEvent) => {
    const {velocity} = e.nativeEvent;
    // - If we are animating, then this is a "drag" that is stopping the scrollview and momentum end
    //   will fire.
    // - If velocity is non-zero, then the interaction will stop when momentum scroll ends or
    //   another drag starts and ends.
    // - If we don't get velocity, better to stop the interaction twice than not stop it.
    if (
      !this._isAnimating() &&
      (!velocity || (velocity.x === 0 && velocity.y === 0))
    ) {
      FrameRateLogger.endScroll();
    }
    this.props.onScrollEndDrag && this.props.onScrollEndDrag(e);
  };

  /**
   * A helper function for this class that lets us quickly determine if the
   * view is currently animating. This is particularly useful to know when
   * a touch has just started or ended.
   */
  _isAnimating: () => boolean = () => {
    const now = global.performance.now();
    const timeSinceLastMomentumScrollEnd =
      now - this._lastMomentumScrollEndTime;
    const isAnimating =
      timeSinceLastMomentumScrollEnd < IS_ANIMATING_TOUCH_START_THRESHOLD_MS ||
      this._lastMomentumScrollEndTime < this._lastMomentumScrollBeginTime;
    return isAnimating;
  };

  /**
   * Invoke this from an `onResponderGrant` event.
   */
  _handleResponderGrant: (e: GestureResponderEvent) => void = (
    e: GestureResponderEvent,
  ) => {
    this._observedScrollSinceBecomingResponder = false;
    this.props.onResponderGrant && this.props.onResponderGrant(e);
    this._becameResponderWhileAnimating = this._isAnimating();
  };

  /**
   * Invoke this from an `onResponderReject` event.
   *
   * Some other element is not yielding its role as responder. Normally, we'd
   * just disable the `UIScrollView`, but a touch has already began on it, the
   * `UIScrollView` will not accept being disabled after that. The easiest
   * solution for now is to accept the limitation of disallowing this
   * altogether. To improve this, find a way to disable the `UIScrollView` after
   * a touch has already started.
   */
  _handleResponderReject: () => void = () => {};

  /**
   * Invoke this from an `onResponderRelease` event.
   */
  _handleResponderRelease: (e: GestureResponderEvent) => void = (
    e: GestureResponderEvent,
  ) => {
    this._isTouching = e.nativeEvent.touches.length !== 0;
    this.props.onResponderRelease && this.props.onResponderRelease(e);

    if (typeof e.target === 'number') {
      if (__DEV__) {
        console.error(
          'Did not expect event target to be a number. Should have been a native component',
        );
      }

      return;
    }

    // By default scroll views will unfocus a textField
    // if another touch occurs outside of it
    const currentlyFocusedTextInput = TextInputState.currentlyFocusedInput();
    if (
      currentlyFocusedTextInput != null &&
      this.props.keyboardShouldPersistTaps !== true &&
      this.props.keyboardShouldPersistTaps !== 'always' &&
      this._keyboardIsDismissible() &&
      e.target !== currentlyFocusedTextInput &&
      !this._observedScrollSinceBecomingResponder &&
      !this._becameResponderWhileAnimating
    ) {
      TextInputState.blurTextInput(currentlyFocusedTextInput);
    }
  };

  /**
   * We will allow the scroll view to give up its lock iff it acquired the lock
   * during an animation. This is a very useful default that happens to satisfy
   * many common user experiences.
   *
   * - Stop a scroll on the left edge, then turn that into an outer view's
   *   backswipe.
   * - Stop a scroll mid-bounce at the top, continue pulling to have the outer
   *   view dismiss.
   * - However, without catching the scroll view mid-bounce (while it is
   *   motionless), if you drag far enough for the scroll view to become
   *   responder (and therefore drag the scroll view a bit), any backswipe
   *   navigation of a swipe gesture higher in the view hierarchy, should be
   *   rejected.
   */
  _handleResponderTerminationRequest: () => boolean = () => {
    return !this._observedScrollSinceBecomingResponder;
  };

  /**
   * Invoke this from an `onScroll` event.
   */
  _handleScrollShouldSetResponder: () => boolean = () => {
    // Allow any event touch pass through if the default pan responder is disabled
    if (this.props.disableScrollViewPanResponder === true) {
      return false;
    }
    return this._isTouching;
  };

  /**
   * Merely touch starting is not sufficient for a scroll view to become the
   * responder. Being the "responder" means that the very next touch move/end
   * event will result in an action/movement.
   *
   * Invoke this from an `onStartShouldSetResponder` event.
   *
   * `onStartShouldSetResponder` is used when the next move/end will trigger
   * some UI movement/action, but when you want to yield priority to views
   * nested inside of the view.
   *
   * There may be some cases where scroll views actually should return `true`
   * from `onStartShouldSetResponder`: Any time we are detecting a standard tap
   * that gives priority to nested views.
   *
   * - If a single tap on the scroll view triggers an action such as
   *   recentering a map style view yet wants to give priority to interaction
   *   views inside (such as dropped pins or labels), then we would return true
   *   from this method when there is a single touch.
   *
   * - Similar to the previous case, if a two finger "tap" should trigger a
   *   zoom, we would check the `touches` count, and if `>= 2`, we would return
   *   true.
   *
   */
  _handleStartShouldSetResponder: (e: GestureResponderEvent) => boolean = (
    e: GestureResponderEvent,
  ) => {
    // Allow any event touch pass through if the default pan responder is disabled
    if (this.props.disableScrollViewPanResponder === true) {
      return false;
    }

    const currentlyFocusedInput = TextInputState.currentlyFocusedInput();
    if (
      this.props.keyboardShouldPersistTaps === 'handled' &&
      this._keyboardIsDismissible() &&
      e.target !== currentlyFocusedInput
    ) {
      return true;
    }
    return false;
  };

  /**
   * There are times when the scroll view wants to become the responder
   * (meaning respond to the next immediate `touchStart/touchEnd`), in a way
   * that *doesn't* give priority to nested views (hence the capture phase):
   *
   * - Currently animating.
   * - Tapping anywhere that is not a text input, while the keyboard is
   *   up (which should dismiss the keyboard).
   *
   * Invoke this from an `onStartShouldSetResponderCapture` event.
   */
  _handleStartShouldSetResponderCapture: (e: GestureResponderEvent) => boolean =
    (e: GestureResponderEvent) => {
      // The scroll view should receive taps instead of its descendants if:
      // * it is already animating/decelerating
      if (this._isAnimating()) {
        return true;
      }

      // Allow any event touch pass through if the default pan responder is disabled
      if (this.props.disableScrollViewPanResponder === true) {
        return false;
      }

      // * the keyboard is up, keyboardShouldPersistTaps is 'never' (the default),
      // and a new touch starts with a non-textinput target (in which case the
      // first tap should be sent to the scroll view and dismiss the keyboard,
      // then the second tap goes to the actual interior view)
      const {keyboardShouldPersistTaps} = this.props;
      const keyboardNeverPersistTaps =
        // $FlowFixMe[sketchy-null-bool]
        !keyboardShouldPersistTaps || keyboardShouldPersistTaps === 'never';

      if (typeof e.target === 'number') {
        if (__DEV__) {
          console.error(
            'Did not expect event target to be a number. Should have been a native component',
          );
        }

        return false;
      }

      // Let presses through if the soft keyboard is detached from the viewport
      if (this._softKeyboardIsDetached()) {
        return false;
      }

      if (
        keyboardNeverPersistTaps &&
        this._keyboardIsDismissible() &&
        e.target != null &&
        // $FlowFixMe[incompatible-type] Error supressed during the migration of HostInstance to ReactNativeElement
        !TextInputState.isTextInput(e.target)
      ) {
        return true;
      }

      return false;
    };

  /**
   * Do we consider there to be a dismissible soft-keyboard open?
   */
  _keyboardIsDismissible: () => boolean = () => {
    const currentlyFocusedInput = TextInputState.currentlyFocusedInput();

    // We cannot dismiss the keyboard without an input to blur, even if a soft
    // keyboard is open (e.g. when keyboard is open due to a native component
    // not participating in TextInputState). It's also possible that the
    // currently focused input isn't a TextInput (such as by calling ref.focus
    // on a non-TextInput).
    const hasFocusedTextInput =
      currentlyFocusedInput != null &&
      TextInputState.isTextInput(currentlyFocusedInput);

    // Even if an input is focused, we may not have a keyboard to dismiss. E.g
    // when using a physical keyboard. Ensure we have an event for an opened
    // keyboard.
    const softKeyboardMayBeOpen =
      this._keyboardMetrics != null || this._keyboardEventsAreUnreliable();

    return hasFocusedTextInput && softKeyboardMayBeOpen;
  };

  /**
   * Whether an open soft keyboard is present which does not overlap the
   * viewport. E.g. for a VR soft-keyboard which is detached from the app
   * viewport.
   */
  _softKeyboardIsDetached: () => boolean = () => {
    return this._keyboardMetrics != null && this._keyboardMetrics.height === 0;
  };

  _keyboardEventsAreUnreliable: () => boolean = () => {
    // Android versions prior to API 30 rely on observing layout changes when
    // `android:windowSoftInputMode` is set to `adjustResize` or `adjustPan`.
    return Platform.OS === 'android' && Platform.Version < 30;
  };

  /**
   * Invoke this from an `onTouchEnd` event.
   *
   * @param {GestureResponderEvent} e Event.
   */
  _handleTouchEnd: (e: GestureResponderEvent) => void = (
    e: GestureResponderEvent,
  ) => {
    const nativeEvent = e.nativeEvent;
    this._isTouching = nativeEvent.touches.length !== 0;

    const {keyboardShouldPersistTaps} = this.props;
    const keyboardNeverPersistsTaps =
      // $FlowFixMe[sketchy-null-bool]
      !keyboardShouldPersistTaps || keyboardShouldPersistTaps === 'never';

    // Dismiss the keyboard now if we didn't become responder in capture phase
    // to eat presses, but still want to dismiss on interaction.
    // Don't do anything if the target of the touch event is the current input.
    const currentlyFocusedTextInput = TextInputState.currentlyFocusedInput();
    if (
      currentlyFocusedTextInput != null &&
      e.target !== currentlyFocusedTextInput &&
      this._softKeyboardIsDetached() &&
      this._keyboardIsDismissible() &&
      keyboardNeverPersistsTaps
    ) {
      TextInputState.blurTextInput(currentlyFocusedTextInput);
    }

    this.props.onTouchEnd && this.props.onTouchEnd(e);
  };

  /**
   * Invoke this from an `onTouchCancel` event.
   *
   * @param {GestureResponderEvent} e Event.
   */
  _handleTouchCancel: (e: GestureResponderEvent) => void = (
    e: GestureResponderEvent,
  ) => {
    this._isTouching = false;
    this.props.onTouchCancel && this.props.onTouchCancel(e);
  };

  /**
   * Invoke this from an `onTouchStart` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param {GestureResponderEvent} e Touch Start event.
   */
  _handleTouchStart: (e: GestureResponderEvent) => void = (
    e: GestureResponderEvent,
  ) => {
    this._isTouching = true;
    this.props.onTouchStart && this.props.onTouchStart(e);
  };

  /**
   * Invoke this from an `onTouchMove` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param {GestureResponderEvent} e Touch Start event.
   */
  _handleTouchMove: (e: GestureResponderEvent) => void = (
    e: GestureResponderEvent,
  ) => {
    this.props.onTouchMove && this.props.onTouchMove(e);
  };

  render(): React.Node {
    const horizontal = this.props.horizontal === true;

    const NativeScrollView = horizontal
      ? HScrollViewNativeComponent
      : VScrollViewNativeComponent;

    const NativeScrollContentView = horizontal
      ? HScrollContentViewNativeComponent
      : VScrollContentViewNativeComponent;

    const contentContainerStyle = [
      horizontal && styles.contentContainerHorizontal,
      this.props.contentContainerStyle,
    ];
    if (__DEV__ && this.props.style !== undefined) {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const style = flattenStyle(this.props.style);
      const childLayoutProps = (
        ['alignItems', 'justifyContent'] as const
      ).filter(
        // $FlowFixMe[incompatible-use]
        prop => style && style[prop] !== undefined,
      );
      invariant(
        childLayoutProps.length === 0,
        'ScrollView child layout (' +
          JSON.stringify(childLayoutProps) +
          ') must be applied through the contentContainerStyle prop.',
      );
    }

    const contentSizeChangeProps =
      this.props.onContentSizeChange == null
        ? null
        : {
            onLayout: this._handleContentOnLayout,
          };

    const {stickyHeaderIndices} = this.props;
    let children = this.props.children;
    /**
     * This function can cause unnecessary remount when nested in conditionals as it causes remap of children keys.
     * https://react.dev/reference/react/Children#children-toarray-caveats
     */
    children = React.Children.toArray<$FlowFixMe>(children);

    if (stickyHeaderIndices != null && stickyHeaderIndices.length > 0) {
      children = children.map((child, index) => {
        const indexOfIndex = child ? stickyHeaderIndices.indexOf(index) : -1;
        if (indexOfIndex > -1) {
          const key = child.key;
          const nextIndex = stickyHeaderIndices[indexOfIndex + 1];
          const StickyHeaderComponent =
            this.props.StickyHeaderComponent || ScrollViewStickyHeader;
          return (
            <StickyHeaderComponent
              key={key}
              /* $FlowFixMe[incompatible-type] */
              ref={ref => this._setStickyHeaderRef(key, ref)}
              nextHeaderLayoutY={this._headerLayoutYs.get(
                this._getKeyForIndex(nextIndex, children),
              )}
              onLayout={event => this._onStickyHeaderLayout(index, event, key)}
              scrollAnimatedValue={this._scrollAnimatedValue}
              inverted={this.props.invertStickyHeaders}
              hiddenOnScroll={this.props.stickyHeaderHiddenOnScroll}
              scrollViewHeight={this.state.layoutHeight}>
              {child}
            </StickyHeaderComponent>
          );
        } else {
          return child;
        }
      });
    }
    children = (
      <ScrollViewContext.Provider value={horizontal ? HORIZONTAL : VERTICAL}>
        {children}
      </ScrollViewContext.Provider>
    );

    const hasStickyHeaders =
      Array.isArray(stickyHeaderIndices) && stickyHeaderIndices.length > 0;

    // Some ScrollView native component behaviors rely on using the metrics
    // of mounted views for anchoring. Make sure not to flatten children if
    // this is the case.
    const preserveChildren =
      this.props.maintainVisibleContentPosition != null ||
      (Platform.OS === 'android' && this.props.snapToAlignment != null);

    const contentContainer = (
      <NativeScrollContentView
        {...contentSizeChangeProps}
        ref={this._innerView.getForwardingRef(this.props.innerViewRef)}
        style={contentContainerStyle}
        removeClippedSubviews={
          // Subview clipping causes issues with sticky headers on Android and
          // would be hard to fix properly in a performant way.
          Platform.OS === 'android' && hasStickyHeaders
            ? false
            : this.props.removeClippedSubviews
        }
        collapsable={false}
        collapsableChildren={!preserveChildren}>
        {children}
      </NativeScrollContentView>
    );

    const alwaysBounceHorizontal =
      this.props.alwaysBounceHorizontal !== undefined
        ? this.props.alwaysBounceHorizontal
        : this.props.horizontal;

    const alwaysBounceVertical =
      this.props.alwaysBounceVertical !== undefined
        ? this.props.alwaysBounceVertical
        : !this.props.horizontal;

    const baseStyle = horizontal ? styles.baseHorizontal : styles.baseVertical;

    const {experimental_endDraggingSensitivityMultiplier, ...otherProps} =
      this.props;
    const props = {
      ...otherProps,
      alwaysBounceHorizontal,
      alwaysBounceVertical,
      style: StyleSheet.compose(baseStyle, this.props.style),
      // Override the onContentSizeChange from props, since this event can
      // bubble up from TextInputs
      onContentSizeChange: null,
      onLayout: this._handleLayout,
      onMomentumScrollBegin: this._handleMomentumScrollBegin,
      onMomentumScrollEnd: this._handleMomentumScrollEnd,
      onResponderGrant: this._handleResponderGrant,
      onResponderReject: this._handleResponderReject,
      onResponderRelease: this._handleResponderRelease,
      onResponderTerminationRequest: this._handleResponderTerminationRequest,
      onScrollBeginDrag: this._handleScrollBeginDrag,
      onScrollEndDrag: this._handleScrollEndDrag,
      onScrollShouldSetResponder: this._handleScrollShouldSetResponder,
      onStartShouldSetResponder: this._handleStartShouldSetResponder,
      onStartShouldSetResponderCapture:
        this._handleStartShouldSetResponderCapture,
      onTouchEnd: this._handleTouchEnd,
      onTouchMove: this._handleTouchMove,
      onTouchStart: this._handleTouchStart,
      onTouchCancel: this._handleTouchCancel,
      onScroll: this._handleScroll,
      endDraggingSensitivityMultiplier:
        experimental_endDraggingSensitivityMultiplier,
      scrollEventThrottle: hasStickyHeaders
        ? 1
        : this.props.scrollEventThrottle,
      sendMomentumEvents:
        this.props.onMomentumScrollBegin || this.props.onMomentumScrollEnd
          ? true
          : false,
      // default to true
      snapToStart: this.props.snapToStart !== false,
      // default to true
      snapToEnd: this.props.snapToEnd !== false,
      // pagingEnabled is overridden by snapToInterval / snapToOffsets
      pagingEnabled: Platform.select({
        // on iOS, pagingEnabled must be set to false to have snapToInterval / snapToOffsets work
        ios:
          this.props.pagingEnabled === true &&
          this.props.snapToInterval == null &&
          this.props.snapToOffsets == null,
        // on Android, pagingEnabled must be set to true to have snapToInterval / snapToOffsets work
        android:
          this.props.pagingEnabled === true ||
          this.props.snapToInterval != null ||
          this.props.snapToOffsets != null,
      }),
    };

    const {decelerationRate} = this.props;
    if (decelerationRate != null) {
      props.decelerationRate = processDecelerationRate(decelerationRate);
    }

    const refreshControl = this.props.refreshControl;
    const scrollViewRef = this._scrollView.getForwardingRef(
      this.props.scrollViewRef,
    );

    if (refreshControl != null) {
      if (Platform.OS === 'ios') {
        // On iOS the RefreshControl is a child of the ScrollView.
        return (
          // $FlowFixMe[incompatible-type] - Flow only knows element refs.
          <NativeScrollView {...props} ref={scrollViewRef}>
            {refreshControl}
            {contentContainer}
          </NativeScrollView>
        );
      } else if (Platform.OS === 'android') {
        // On Android wrap the ScrollView with a AndroidSwipeRefreshLayout.
        // Since the ScrollView is wrapped add the style props to the
        // AndroidSwipeRefreshLayout and use flex: 1 for the ScrollView.
        // Note: we should split props.style on the inner and outer props
        // however, the ScrollView still needs the baseStyle to be scrollable
        const {outer, inner} = splitLayoutProps(flattenStyle(props.style));
        // $FlowFixMe[incompatible-type]
        return cloneElement(
          refreshControl,
          {style: StyleSheet.compose(baseStyle, outer)},
          <NativeScrollView
            {...props}
            // Nested scroll should always be enabled to allow the child scroll view to handle events before passing them to the refresh control parent
            nestedScrollEnabled={props.nestedScrollEnabled ?? true}
            style={StyleSheet.compose(baseStyle, inner)}
            // $FlowFixMe[incompatible-type] - Flow only knows element refs.
            ref={scrollViewRef}>
            {contentContainer}
          </NativeScrollView>,
        );
      }
    }
    return (
      // $FlowFixMe[incompatible-type] - Flow only knows element refs.
      <NativeScrollView {...props} ref={scrollViewRef}>
        {contentContainer}
      </NativeScrollView>
    );
  }
}

const styles = StyleSheet.create({
  baseVertical: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
    overflow: 'scroll',
  },
  baseHorizontal: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    overflow: 'scroll',
  },
  contentContainerHorizontal: {
    flexDirection: 'row',
  },
});

type RefForwarder<TNativeInstance, TPublicInstance> = {
  getForwardingRef: (
    ?React.RefSetter<TPublicInstance>,
  ) => (TNativeInstance | null) => void,
  nativeInstance: TNativeInstance | null,
  publicInstance: TPublicInstance | null,
};

/**
 * Helper function that should be replaced with `useCallback` and `useMergeRefs`
 * once `ScrollView` is reimplemented as a functional component.
 */
function createRefForwarder<TNativeInstance, TPublicInstance>(
  mutator: TNativeInstance => TPublicInstance,
): RefForwarder<TNativeInstance, TPublicInstance> {
  const state: RefForwarder<TNativeInstance, TPublicInstance> = {
    getForwardingRef: memoize(forwardedRef => {
      return (nativeInstance: TNativeInstance | null): void => {
        const publicInstance =
          nativeInstance == null ? null : mutator(nativeInstance);

        state.nativeInstance = nativeInstance;
        state.publicInstance = publicInstance;

        if (forwardedRef != null) {
          if (typeof forwardedRef === 'function') {
            forwardedRef(publicInstance);
          } else {
            forwardedRef.current = publicInstance;
          }
        }
      };
    }),
    nativeInstance: null,
    publicInstance: null,
  };

  return state;
}

// NOTE: This wrapper component is necessary because `ScrollView` is a class
// component and we need to map `ref` to a differently named prop. This can be
// removed when `ScrollView` is a functional component.
const ScrollViewWrapper: component(
  ref?: React.RefSetter<ScrollViewInstance>,
  ...props: ScrollViewProps
) = function Wrapper({
  ref,
  ...props
}: {
  ref?: React.RefSetter<ScrollViewInstance>,
  ...ScrollViewProps,
}): React.Node {
  return ref == null ? (
    <ScrollView {...props} />
  ) : (
    <ScrollView {...props} scrollViewRef={ref} />
  );
};
ScrollViewWrapper.displayName = 'ScrollView';
// $FlowExpectedError[prop-missing]
ScrollViewWrapper.Context = ScrollViewContext;

export default ScrollViewWrapper as $FlowFixMe as typeof ScrollViewWrapper &
  ScrollViewComponentStatics;
