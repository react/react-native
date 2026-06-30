/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from '../../../types/private/Utilities';
import {Insets} from '../../../types/public/Insets';
import {HostInstance} from '../../../types/public/ReactNativeTypes';
import {ColorValue, StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {
  NativeSyntheticEvent,
  NativeTouchEvent,
} from '../../Types/CoreEventTypes';
import {RefreshControlProps} from '../RefreshControl/RefreshControl';
import {Touchable} from '../Touchable/Touchable';
import {ViewProps} from '../View/ViewPropTypes';
import {View} from '../View/View';

// See https://reactnative.dev/docs/scrollview#contentoffset
export interface PointProp {
  x: number;
  y: number;
}

export interface ScrollResponderEvent
  extends NativeSyntheticEvent<NativeTouchEvent> {}

interface SubscribableMixin {
  /**
   * Special form of calling `addListener` that *guarantees* that a
   * subscription *must* be tied to a component instance, and therefore will
   * be cleaned up when the component is unmounted. It is impossible to create
   * the subscription and pass it in - this method must be the one to create
   * the subscription and therefore can guarantee it is retained in a way that
   * will be cleaned up.
   *
   * @param eventEmitter emitter to subscribe to.
   * @param eventType Type of event to listen to.
   * @param listener Function to invoke when event occurs.
   * @param context Object to use as listener context.
   */
  addListenerOn(
    eventEmitter: any,
    eventType: string,
    listener: () => any,
    context: any,
  ): void;
}

interface ScrollResponderMixin extends SubscribableMixin {
  /**
   * Invoke this from an `onScroll` event.
   */
  scrollResponderHandleScrollShouldSetResponder(): boolean;

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
  scrollResponderHandleStartShouldSetResponder(): boolean;

  /**
   * There are times when the scroll view wants to become the responder
   * (meaning respond to the next immediate `touchStart/touchEnd`), in a way
   * that *doesn't* give priority to nested views (hence the capture phase):
   *
   * - Currently animating.
   * - Tapping anywhere that is not the focused input, while the keyboard is
   *   up (which should dismiss the keyboard).
   *
   * Invoke this from an `onStartShouldSetResponderCapture` event.
   */
  scrollResponderHandleStartShouldSetResponderCapture(
    e: ScrollResponderEvent,
  ): boolean;

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
  scrollResponderHandleResponderReject(): any;

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
  scrollResponderHandleTerminationRequest(): boolean;

  /**
   * Invoke this from an `onTouchEnd` event.
   *
   * @param e Event.
   */
  scrollResponderHandleTouchEnd(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onResponderRelease` event.
   */
  scrollResponderHandleResponderRelease(e: ScrollResponderEvent): void;

  scrollResponderHandleScroll(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onResponderGrant` event.
   */
  scrollResponderHandleResponderGrant(e: ScrollResponderEvent): void;

  /**
   * Unfortunately, `onScrollBeginDrag` also fires when *stopping* the scroll
   * animation, and there's not an easy way to distinguish a drag vs. stopping
   * momentum.
   *
   * Invoke this from an `onScrollBeginDrag` event.
   */
  scrollResponderHandleScrollBeginDrag(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onScrollEndDrag` event.
   */
  scrollResponderHandleScrollEndDrag(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onMomentumScrollBegin` event.
   */
  scrollResponderHandleMomentumScrollBegin(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onMomentumScrollEnd` event.
   */
  scrollResponderHandleMomentumScrollEnd(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onTouchStart` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param e Touch Start event.
   */
  scrollResponderHandleTouchStart(e: ScrollResponderEvent): void;

  /**
   * Invoke this from an `onTouchMove` event.
   *
   * Since we know that the `SimpleEventPlugin` occurs later in the plugin
   * order, after `ResponderEventPlugin`, we can detect that we were *not*
   * permitted to be the responder (presumably because a contained view became
   * responder). The `onResponderReject` won't fire in that case - it only
   * fires when a *current* responder rejects our request.
   *
   * @param e Touch Start event.
   */
  scrollResponderHandleTouchMove(e: ScrollResponderEvent): void;

  /**
   * A helper function for this class that lets us quickly determine if the
   * view is currently animating. This is particularly useful to know when
   * a touch has just started or ended.
   */
  scrollResponderIsAnimating(): boolean;

  /**
   * Returns the node that represents native view that can be scrolled.
   * Components can pass what node to use by defining a `getScrollableNode`
   * function otherwise `this` is used.
   */
  scrollResponderGetScrollableNode(): any;

  /**
   * A helper function to scroll to a specific point  in the scrollview.
   * This is currently used to help focus on child textviews, but can also
   * be used to quickly scroll to any element we want to focus. Syntax:
   *
   * scrollResponderScrollTo(options: {x: number = 0; y: number = 0; animated: boolean = true})
   *
   * Note: The weird argument signature is due to the fact that, for historical reasons,
   * the function also accepts separate arguments as an alternative to the options object.
   * This is deprecated due to ambiguity (y before x), and SHOULD NOT BE USED.
   */
  scrollResponderScrollTo(
    x?:
      | number
      | {
          x?: number | undefined;
          y?: number | undefined;
          animated?: boolean | undefined;
        },
    y?: number,
    animated?: boolean,
  ): void;

  /**
   * A helper function to zoom to a specific rect in the scrollview. The argument has the shape
   * {x: number; y: number; width: number; height: number; animated: boolean = true}
   *
   * @platform ios
   */
  scrollResponderZoomTo(
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
      animated?: boolean | undefined;
    },
    animated?: boolean, // deprecated, put this inside the rect argument instead
  ): void;

  /**
   * This method should be used as the callback to onFocus in a TextInputs'
   * parent view. Note that any module using this mixin needs to return
   * the parent view's ref in getScrollViewRef() in order to use this method.
   * @param nodeHandle The TextInput node handle
   * @param additionalOffset The scroll view's top "contentInset".
   *        Default is 0.
   * @param preventNegativeScrolling Whether to allow pulling the content
   *        down to make it meet the keyboard's top. Default is false.
   */
  scrollResponderScrollNativeHandleToKeyboard(
    nodeHandle: number | HostInstance,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean,
  ): void;

  /**
   * The calculations performed here assume the scroll view takes up the entire
   * screen - even if has some content inset. We then measure the offsets of the
   * keyboard, and compensate both for the scroll view's "contentInset".
   *
   * @param left Position of input w.r.t. table view.
   * @param top Position of input w.r.t. table view.
   * @param width Width of the text input.
   * @param height Height of the text input.
   */
  scrollResponderInputMeasureAndScrollToKeyboard(
    left: number,
    top: number,
    width: number,
    height: number,
  ): void;

  scrollResponderTextInputFocusError(e: ScrollResponderEvent): void;

  /**
   * `componentWillMount` is the closest thing to a  standard "constructor" for
   * React components.
   *
   * The `keyboardWillShow` is called before input focus.
   */
  componentWillMount(): void;

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
   * The `ScrollResponder` providesModule callbacks for each of these events.
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
  scrollResponderKeyboardWillShow(e: ScrollResponderEvent): void;

  scrollResponderKeyboardWillHide(e: ScrollResponderEvent): void;

  scrollResponderKeyboardDidShow(e: ScrollResponderEvent): void;

  scrollResponderKeyboardDidHide(e: ScrollResponderEvent): void;
}

export interface ScrollViewPropsIOS {
  /**
   * When true the scroll view bounces horizontally when it reaches the end
   * even if the content is smaller than the scroll view itself. The default
   * value is true when `horizontal={true}` and false otherwise.
   */
  alwaysBounceHorizontal?: boolean | undefined;
  /**
   * When true the scroll view bounces vertically when it reaches the end
   * even if the content is smaller than the scroll view itself. The default
   * value is false when `horizontal={true}` and true otherwise.
   */
  alwaysBounceVertical?: boolean | undefined;

  /**
   * Controls whether iOS should automatically adjust the content inset for scroll views that are placed behind a navigation bar or tab bar/ toolbar.
   * The default value is true.
   */
  automaticallyAdjustContentInsets?: boolean | undefined; // true

  /**
   * Controls whether the ScrollView should automatically adjust its contentInset and
   * scrollViewInsets when the Keyboard changes its size. The default value is false.
   */
  automaticallyAdjustKeyboardInsets?: boolean | undefined;

  /**
   * Controls whether iOS should automatically adjust the scroll indicator
   * insets. The default value is true. Available on iOS 13 and later.
   */
  automaticallyAdjustsScrollIndicatorInsets?: boolean | undefined;

  /**
   * When true the scroll view bounces when it reaches the end of the
   * content if the content is larger than the scroll view along the axis of
   * the scroll direction. When false it disables all bouncing even if
   * the `alwaysBounce*` props are true. The default value is true.
   */
  bounces?: boolean | undefined;
  /**
   * When true gestures can drive zoom past min/max and the zoom will animate
   * to the min/max value at gesture end otherwise the zoom will not exceed
   * the limits.
   */
  bouncesZoom?: boolean | undefined;

  /**
   * When false once tracking starts won't try to drag if the touch moves.
   * The default value is true.
   */
  canCancelContentTouches?: boolean | undefined;

  /**
   * When true the scroll view automatically centers the content when the
   * content is smaller than the scroll view bounds; when the content is
   * larger than the scroll view this property has no effect. The default
   * value is false.
   */
  centerContent?: boolean | undefined;

  /**
   * The amount by which the scroll view content is inset from the edges of the scroll view.
   * Defaults to {0, 0, 0, 0}.
   */
  contentInset?: Insets | undefined; // zeros

  /**
   * Used to manually set the starting scroll offset.
   * The default value is {x: 0, y: 0}
   */
  contentOffset?: PointProp | undefined; // zeros

  /**
   * This property specifies how the safe area insets are used to modify the content area of the scroll view.
   * The default value of this property is "never".
   */
  contentInsetAdjustmentBehavior?:
    | 'automatic'
    | 'scrollableAxes'
    | 'never'
    | 'always'
    | undefined;

  /**
   * When true the ScrollView will try to lock to only vertical or horizontal
   * scrolling while dragging.  The default value is false.
   */
  directionalLockEnabled?: boolean | undefined;

  /**
   * The style of the scroll indicators.
   * - default (the default), same as black.
   * - black, scroll indicator is black. This style is good against
   *   a white content background.
   * - white, scroll indicator is white. This style is good against
   *   a black content background.
   */
  indicatorStyle?: 'default' | 'black' | 'white' | undefined;

  /**
   * When set, the scroll view will adjust the scroll position so that the first child
   * that is currently visible and at or beyond minIndexForVisible will not change position.
   * This is useful for lists that are loading content in both directions, e.g. a chat thread,
   * where new messages coming in might otherwise cause the scroll position to jump. A value
   * of 0 is common, but other values such as 1 can be used to skip loading spinners or other
   * content that should not maintain position.
   *
   * The optional autoscrollToTopThreshold can be used to make the content automatically scroll
   * to the top after making the adjustment if the user was within the threshold of the top
   * before the adjustment was made. This is also useful for chat-like applications where you
   * want to see new messages scroll into place, but not if the user has scrolled up a ways and
   * it would be disruptive to scroll a bunch.
   *
   * Caveat 1: Reordering elements in the scrollview with this enabled will probably cause
   * jumpiness and jank. It can be fixed, but there are currently no plans to do so. For now,
   * don't re-order the content of any ScrollViews or Lists that use this feature.
   *
   * Caveat 2: This uses contentOffset and frame.origin in native code to compute visibility.
   * Occlusion, transforms, and other complexity won't be taken into account as to whether
   * content is "visible" or not.
   */
  maintainVisibleContentPosition?:
    | null
    | {
        autoscrollToTopThreshold?: number | null | undefined;
        minIndexForVisible: number;
      }
    | undefined;
  /**
   * The maximum allowed zoom scale. The default value is 1.0.
   */
  maximumZoomScale?: number | undefined;

  /**
   * The minimum allowed zoom scale. The default value is 1.0.
   */
  minimumZoomScale?: number | undefined;

  /**
   * Called when a scrolling animation ends.
   */
  onScrollAnimationEnd?: (() => void) | undefined;

  /**
   * When true, ScrollView allows use of pinch gestures to zoom in and out.
   * The default value is true.
   */
  pinchGestureEnabled?: boolean | undefined;

  /**
   * Limits how often scroll events will be fired while scrolling, specified as
   * a time interval in ms. This may be useful when expensive work is performed
   * in response to scrolling. Values <= `16` will disable throttling,
   * regardless of the refresh rate of the device.
   */
  scrollEventThrottle?: number | undefined;

  /**
   * The amount by which the scroll view indicators are inset from the edges of the scroll view.
   * This should normally be set to the same value as the contentInset.
   * Defaults to {0, 0, 0, 0}.
   */
  scrollIndicatorInsets?: Insets | undefined; //zeroes

  /**
   * When true, the scroll view can be programmatically scrolled beyond its
   * content size. The default value is false.
   * @platform ios
   */
  scrollToOverflowEnabled?: boolean | undefined;

  /**
   * When true the scroll view scrolls to top when the status bar is tapped.
   * The default value is true.
   */
  scrollsToTop?: boolean | undefined;

  /**
   * When `snapToInterval` is set, `snapToAlignment` will define the relationship of the snapping to the scroll view.
   *      - `start` (the default) will align the snap at the left (horizontal) or top (vertical)
   *      - `center` will align the snap in the center
   *      - `end` will align the snap at the right (horizontal) or bottom (vertical)
   */
  snapToAlignment?: 'start' | 'center' | 'end' | undefined;

  /**
   * Fires when the scroll view scrolls to top after the status bar has been tapped
   * @platform ios
   */
  onScrollToTop?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * The current scale of the scroll view content. The default value is 1.0.
   */
  zoomScale?: number | undefined;
}

export interface ScrollViewPropsAndroid {
  /**
   * Sometimes a scrollview takes up more space than its content fills.
   * When this is the case, this prop will fill the rest of the
   * scrollview with a color to avoid setting a background and creating
   * unnecessary overdraw. This is an advanced optimization that is not
   * needed in the general case.
   */
  endFillColor?: ColorValue | undefined;

  /**
   * Tag used to log scroll performance on this scroll view. Will force
   * momentum events to be turned on (see sendMomentumEvents). This doesn't do
   * anything out of the box and you need to implement a custom native
   * FpsListener for it to be useful.
   * @platform android
   */
  scrollPerfTag?: string | undefined;

  /**
     * Used to override default value of overScroll mode.

        * Possible values:
        *   - 'auto' - Default value, allow a user to over-scroll this view only if the content is large enough to meaningfully scroll.
        *   - 'always' - Always allow a user to over-scroll this view.
        *   - 'never' - Never allow a user to over-scroll this view.
        */
  overScrollMode?: 'auto' | 'always' | 'never' | undefined;

  /**
   * Enables nested scrolling for Android API level 21+. Nested scrolling is supported by default on iOS.
   */
  nestedScrollEnabled?: boolean | undefined;

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
  fadingEdgeLength?: number | {start: number; end: number} | undefined;

  /**
   * Causes the scrollbars not to turn transparent when they are not in use. The default value is false.
   */
  persistentScrollbar?: boolean | undefined;

  /**
   * When false, the ScrollView will not automatically scroll to a focused child when
   * the child requests focus. This can be useful when you want to control the scroll
   * position programmatically. The default value is true.
   *
   * @platform android
   */
  scrollsChildToFocus?: boolean | undefined;
}

export interface ScrollViewProps
  extends ViewProps,
    ScrollViewPropsIOS,
    ScrollViewPropsAndroid,
    Touchable {
  /**
   * These styles will be applied to the scroll view content container which
   * wraps all of the child views. Example:
   *
   *   return (
   *     <ScrollView contentContainerStyle={styles.contentContainer}>
   *     </ScrollView>
   *   );
   *   ...
   *   const styles = StyleSheet.create({
   *     contentContainer: {
   *       paddingVertical: 20
   *     }
   *   });
   */
  contentContainerStyle?: StyleProp<ViewStyle> | undefined;

  /**
   * A ref to the inner View element of the ScrollView. This should be used
   * instead of calling `getInnerViewRef`.
   */
  innerViewRef?: React.RefObject<View> | undefined;

  /**
   * A ref to the Native ScrollView component. This ref can be used to call
   * all of ScrollView's public methods, in addition to native methods like
   * measure, measureLayout, etc.
   */
  scrollViewRef?: React.RefObject<ScrollView> | undefined;

  /**
   * A floating-point number that determines how quickly the scroll view
   * decelerates after the user lifts their finger. You may also use string
   * shortcuts `"normal"` and `"fast"` which match the underlying iOS settings
   * for `UIScrollViewDecelerationRateNormal` and
   * `UIScrollViewDecelerationRateFast` respectively.
   *
   *  - `'normal'`: 0.998 on iOS, 0.985 on Android (the default)
   *  - `'fast'`: 0.99 on iOS, 0.9 on Android
   */
  decelerationRate?: 'fast' | 'normal' | number | undefined;

  /**
   * When true the scroll view's children are arranged horizontally in a row
   * instead of vertically in a column. The default value is false.
   */
  horizontal?: boolean | null | undefined;

  /**
   * If sticky headers should stick at the bottom instead of the top of the
   * ScrollView. This is usually used with inverted ScrollViews.
   */
  invertStickyHeaders?: boolean | undefined;

  /**
   * Determines whether the keyboard gets dismissed in response to a drag.
   *   - 'none' (the default) drags do not dismiss the keyboard.
   *   - 'onDrag' the keyboard is dismissed when a drag begins.
   *   - 'interactive' the keyboard is dismissed interactively with the drag
   *     and moves in synchrony with the touch; dragging upwards cancels the
   *     dismissal.
   */
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag' | undefined;

  /**
   * Determines when the keyboard should stay visible after a tap.
   * - 'never' (the default), tapping outside of the focused text input when the keyboard is up dismisses the keyboard. When this happens, children won't receive the tap.
   * - 'always', the keyboard will not dismiss automatically, and the scroll view will not catch taps, but children of the scroll view can catch taps.
   * - 'handled', the keyboard will not dismiss automatically when the tap was handled by a children, (or captured by an ancestor).
   */
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled' | undefined;

  /**
   * Called when scrollable content view of the ScrollView changes.
   * Handler function is passed the content width and content height as parameters: (contentWidth, contentHeight)
   * It's implemented using onLayout handler attached to the content container which this ScrollView renders.
   *
   */
  onContentSizeChange?:
    | ((contentWidth: number, contentHeight: number) => void)
    | undefined;

  /**
   * Fires at most once per frame during scrolling.
   */
  onScroll?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires if a user initiates a scroll gesture.
   */
  onScrollBeginDrag?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires when a user has finished scrolling.
   */
  onScrollEndDrag?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires when scroll view has finished moving
   */
  onMomentumScrollEnd?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * Fires when scroll view has begun moving
   */
  onMomentumScrollBegin?:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * When true the scroll view stops on multiples of the scroll view's size
   * when scrolling. This can be used for horizontal pagination. The default
   * value is false.
   */
  pagingEnabled?: boolean | undefined;

  /**
   * When false, the content does not scroll. The default value is true
   */
  scrollEnabled?: boolean | undefined; // true

  /**
   * Experimental: When true offscreen child views (whose `overflow` value is
   * `hidden`) are removed from their native backing superview when offscreen.
   * This can improve scrolling performance on long lists. The default value is
   * false.
   */
  removeClippedSubviews?: boolean | undefined;

  /**
   * When true, shows a horizontal scroll indicator.
   */
  showsHorizontalScrollIndicator?: boolean | undefined;

  /**
   * When true, shows a vertical scroll indicator.
   */
  showsVerticalScrollIndicator?: boolean | undefined;

  /**
   * When true, Sticky header is hidden when scrolling down, and dock at the top when scrolling up.
   */
  stickyHeaderHiddenOnScroll?: boolean | undefined;

  /**
   * Style
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * A RefreshControl component, used to provide pull-to-refresh
   * functionality for the ScrollView.
   */
  refreshControl?: React.ReactElement<RefreshControlProps> | undefined;

  /**
   * When set, causes the scroll view to stop at multiples of the value of `snapToInterval`.
   * This can be used for paginating through children that have lengths smaller than the scroll view.
   * Used in combination with `snapToAlignment` and `decelerationRate="fast"`. Overrides less
   * configurable `pagingEnabled` prop.
   */
  snapToInterval?: number | undefined;

  /**
   * When set, causes the scroll view to stop at the defined offsets. This can be used for
   * paginating through variously sized children that have lengths smaller than the scroll view.
   * Typically used in combination with `decelerationRate="fast"`. Overrides less configurable
   * `pagingEnabled` and `snapToInterval` props.
   */
  snapToOffsets?: number[] | undefined;

  /**
   * Use in conjunction with `snapToOffsets`. By default, the beginning of the list counts as a
   * snap offset. Set `snapToStart` to false to disable this behavior and allow the list to scroll
   * freely between its start and the first `snapToOffsets` offset. The default value is true.
   */
  snapToStart?: boolean | undefined;

  /**
   * Use in conjunction with `snapToOffsets`. By default, the end of the list counts as a snap
   * offset. Set `snapToEnd` to false to disable this behavior and allow the list to scroll freely
   * between its end and the last `snapToOffsets` offset. The default value is true.
   */
  snapToEnd?: boolean | undefined;

  /**
   * An array of child indices determining which children get docked to the
   * top of the screen when scrolling. For example passing
   * `stickyHeaderIndices={[0]}` will cause the first child to be fixed to the
   * top of the scroll view. This property is not supported in conjunction
   * with `horizontal={true}`.
   */
  stickyHeaderIndices?: number[] | undefined;

  /**
   * When true, the scroll view stops on the next index (in relation to scroll position at release)
   * regardless of how fast the gesture is. This can be used for horizontal pagination when the page
   * is less than the width of the ScrollView. The default value is false.
   */
  disableIntervalMomentum?: boolean | undefined;

  /**
   * When true, the default JS pan responder on the ScrollView is disabled, and full control over
   * touches inside the ScrollView is left to its child components. This is particularly useful
   * if `snapToInterval` is enabled, since it does not follow typical touch patterns. Do not use
   * this on regular ScrollView use cases without `snapToInterval` as it may cause unexpected
   * touches to occur while scrolling. The default value is false.
   */
  disableScrollViewPanResponder?: boolean | undefined;

  /**
   * A React Component that will be used to render sticky headers, should be used together with
   * stickyHeaderIndices. You may need to set this component if your sticky header uses custom
   * transforms, for example, when you want your list to have an animated and hidable header.
   * If component have not been provided, the default ScrollViewStickyHeader component will be used.
   */
  StickyHeaderComponent?: React.ComponentType<any> | undefined;
}

export interface ScrollViewScrollToOptions {
  x?: number | undefined;
  y?: number | undefined;
  animated?: boolean | undefined;
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
  readonly getScrollableNode: () => number | undefined;
  readonly getInnerViewNode: () => number | undefined;
  readonly getInnerViewRef: () => React.ComponentRef<typeof View> | null;
  /**
   * Returns a reference to the underlying native scroll view, or null if the
   * native instance is not mounted.
   */
  readonly getNativeScrollRef: () => HostInstance | null;
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
  readonly scrollToEnd: (options?: ScrollViewScrollToOptions | null) => void;
  /**
   * Displays the scroll indicators momentarily.
   */
  readonly flashScrollIndicators: () => void;
  scrollResponderZoomTo(
    rect: {
      x: number;
      y: number;
      width: number;
      height: number;
      animated?: boolean | undefined;
    },
    animated?: boolean, // deprecated, put this inside the rect argument instead
  ): void;
  scrollResponderScrollNativeHandleToKeyboard(
    nodeHandle: number | HostInstance,
    additionalOffset?: number,
    preventNegativeScrollOffset?: boolean,
  ): void;
}

export type ScrollResponderType = ScrollViewImperativeMethods;

export interface PublicScrollViewInstance
  extends HostInstance,
    ScrollViewImperativeMethods {}

declare class ScrollViewComponent extends React.Component<ScrollViewProps> {}
export declare const ScrollViewBase: Constructor<ScrollResponderMixin> &
  typeof ScrollViewComponent;
export interface ScrollView extends ScrollViewImperativeMethods {}
export class ScrollView extends ScrollViewBase {
  /**
   * @deprecated Use scrollTo instead
   */
  scrollWithoutAnimationTo?: ((y: number, x: number) => void) | undefined;

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](https://reactnative.dev/docs/the-new-architecture/direct-manipulation-new-architecture)).
   */
  setNativeProps(nativeProps: object): void;
}

export interface NativeScrollRectangle {
  left: number;
  top: number;
  bottom: number;
  right: number;
}

export interface NativeScrollPoint {
  x: number;
  y: number;
}

export interface NativeScrollVelocity {
  x: number;
  y: number;
}

export interface NativeScrollSize {
  height: number;
  width: number;
}

export interface NativeScrollEvent {
  contentInset: NativeScrollRectangle;
  contentOffset: NativeScrollPoint;
  contentSize: NativeScrollSize;
  layoutMeasurement: NativeScrollSize;
  velocity?: NativeScrollVelocity | undefined;
  zoomScale: number;
  /**
   * @platform ios
   */
  targetContentOffset?: NativeScrollPoint | undefined;
}
