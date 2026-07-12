/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Insets} from '../../../types/public/Insets';
import {GestureResponderHandlers} from '../../../types/public/ReactNativeRenderer';
import {StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {
  BlurEvent,
  FocusEvent,
  LayoutChangeEvent,
  PointerEvents,
} from '../../Types/CoreEventTypes';
import {Touchable} from '../Touchable/Touchable';
import {AccessibilityProps} from './ViewAccessibility';

/**
 * @deprecated These properties are not implemented natively.
 */
export interface TVViewPropsIOS {
  /**
   * *(Apple TV only)* When set to true, this view will be focusable
   * and navigable using the Apple TV remote.
   *
   * @platform ios
   */
  isTVSelectable?: boolean | undefined;

  /**
   * *(Apple TV only)* May be set to true to force the Apple TV focus engine to move focus to this view.
   *
   * @platform ios
   * @deprecated Use `focusable` instead
   */
  hasTVPreferredFocus?: boolean | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceX?: number | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 2.0.
   *
   * @platform ios
   */
  tvParallaxShiftDistanceY?: number | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 0.05.
   *
   * @platform ios
   */
  tvParallaxTiltAngle?: number | undefined;

  /**
   * *(Apple TV only)* May be used to change the appearance of the Apple TV parallax effect when this view goes in or out of focus.  Defaults to 1.0.
   *
   * @platform ios
   */
  tvParallaxMagnification?: number | undefined;
}

export interface ViewPropsIOS extends TVViewPropsIOS {
  /**
   * Whether this view should be rendered as a bitmap before compositing.
   *
   * On iOS, this is useful for animations and interactions that do not modify this component's dimensions nor its children;
   * for example, when translating the position of a static view, rasterization allows the renderer to reuse a cached bitmap of a static view
   * and quickly composite it during each frame.
   *
   * Rasterization incurs an off-screen drawing pass and the bitmap consumes memory.
   * Test and measure when using this property.
   */
  shouldRasterizeIOS?: boolean | undefined;
}

export interface ViewPropsAndroid {
  /**
   * Callback that is called when the view is blurred.
   *
   * Note: This will only be called if the view is focusable.
   */
  onBlur?: ((e: BlurEvent) => void) | null | undefined;

  /**
   * Callback that is called when the view is focused.
   *
   * Note: This will only be called if the view is focusable.
   */
  onFocus?: ((e: FocusEvent) => void) | null | undefined;

  /**
   * Whether this view should render itself (and all of its children) into a single hardware texture on the GPU.
   *
   * On Android, this is useful for animations and interactions that only modify opacity, rotation, translation, and/or scale:
   * in those cases, the view doesn't have to be redrawn and display lists don't need to be re-executed. The texture can just be
   * re-used and re-composited with different parameters. The downside is that this can use up limited video memory, so this prop should be set back to false at the end of the interaction/animation.
   */
  renderToHardwareTextureAndroid?: boolean | undefined;

  /**
   * Whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
   */
  focusable?: boolean | undefined;

  /**
   * Indicates whether this `View` should be focusable with a non-touch input device, eg. receive focus with a hardware keyboard.
   * See https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex
   * for more details.
   *
   * Supports the following values:
   * -  0 (View is focusable)
   * - -1 (View is not focusable)
   */
  tabIndex?: 0 | -1 | undefined;
}

/**
 * @see https://reactnative.dev/docs/view#props
 */
export interface ViewProps
  extends
    ViewPropsAndroid,
    ViewPropsIOS,
    GestureResponderHandlers,
    Touchable,
    PointerEvents,
    AccessibilityProps {
  children?: React.ReactNode | undefined;
  /**
   * This defines how far a touch event can start away from the view.
   * Typical interface guidelines recommend touch targets that are at least
   * 30 - 40 points/density-independent pixels. If a Touchable view has
   * a height of 20 the touchable height can be extended to 40 with
   * hitSlop={{top: 10, bottom: 10, left: 0, right: 0}}
   * NOTE The touch area never extends past the parent view bounds and
   * the Z-index of sibling views always takes precedence if a touch
   * hits two overlapping views.
   */
  hitSlop?: null | Insets | number | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  id?: string | undefined;

  /**
   * Whether this view needs to rendered offscreen and composited with an alpha in order to preserve 100% correct colors and blending behavior.
   * The default (false) falls back to drawing the component and its children
   * with an alpha applied to the paint used to draw each element instead of rendering the full component offscreen and compositing it back with an alpha value.
   * This default may be noticeable and undesired in the case where the View you are setting an opacity on
   * has multiple overlapping elements (e.g. multiple overlapping Views, or text and a background).
   *
   * Rendering offscreen to preserve correct alpha behavior is extremely expensive
   * and hard to debug for non-native developers, which is why it is not turned on by default.
   * If you do need to enable this property for an animation,
   * consider combining it with renderToHardwareTextureAndroid if the view contents are static (i.e. it doesn't need to be redrawn each frame).
   * If that property is enabled, this View will be rendered off-screen once,
   * saved in a hardware texture, and then composited onto the screen with an alpha each frame without having to switch rendering targets on the GPU.
   */
  needsOffscreenAlphaCompositing?: boolean | undefined;

  /**
   * Invoked on mount and layout changes with
   *
   * {nativeEvent: { layout: {x, y, width, height}}}.
   */
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined;

  /**
   *
   * In the absence of auto property, none is much like CSS's none value. box-none is as if you had applied the CSS class:
   *
   * .box-none {
   *   pointer-events: none;
   * }
   * .box-none * {
   *   pointer-events: all;
   * }
   *
   * box-only is the equivalent of
   *
   * .box-only {
   *   pointer-events: all;
   * }
   * .box-only * {
   *   pointer-events: none;
   * }
   *
   * But since pointerEvents does not affect layout/appearance, and we are already deviating from the spec by adding additional modes,
   * we opt to not include pointerEvents on style. On some platforms, we would need to implement it as a className anyways. Using style or not is an implementation detail of the platform.
   */
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto' | undefined;

  /**
   *
   * This is a special performance property exposed by RCTView and is useful for scrolling content when there are many subviews,
   * most of which are offscreen. For this property to be effective, it must be applied to a view that contains many subviews that extend outside its bound.
   * The subviews must also have overflow: hidden, as should the containing view (or one of its superviews).
   */
  removeClippedSubviews?: boolean | undefined;

  style?: StyleProp<ViewStyle> | undefined;

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: string | undefined;

  /**
   * Used to reference react managed views from native code.
   */
  nativeID?: string | undefined;

  /**
   * Views that are only used to layout their children or otherwise don't draw anything
   * may be automatically removed from the native hierarchy as an optimization.
   * Set this property to false to disable this optimization and ensure that this View exists in the native view hierarchy.
   */
  collapsable?: boolean | undefined;

  /**
   * Setting to false prevents direct children of the view from being removed
   * from the native view hierarchy, similar to the effect of setting
   * `collapsable={false}` on each child.
   */
  collapsableChildren?: boolean | undefined;
}
