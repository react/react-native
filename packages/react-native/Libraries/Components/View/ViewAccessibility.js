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

import type {NativeSyntheticEvent} from '../../Types/CoreEventTypes';

// This must be kept in sync with the AccessibilityRolesMask in RCTViewManager.m
export type AccessibilityRole =
  | 'none'
  | 'button'
  | 'dropdownlist'
  | 'togglebutton'
  | 'link'
  | 'search'
  | 'image'
  | 'keyboardkey'
  | 'text'
  | 'adjustable'
  | 'imagebutton'
  | 'header'
  | 'summary'
  | 'alert'
  | 'checkbox'
  | 'combobox'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'scrollbar'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tabbar'
  | 'tablist'
  | 'timer'
  | 'list'
  | 'toolbar'
  | 'grid'
  | 'pager'
  | 'scrollview'
  | 'horizontalscrollview'
  | 'viewgroup'
  | 'webview'
  | 'drawerlayout'
  | 'slidingdrawer'
  | 'iconmenu'
  | string;

// Role types for web
export type Role =
  | 'alert'
  | 'alertdialog'
  | 'application'
  | 'article'
  | 'banner'
  | 'button'
  | 'cell'
  | 'checkbox'
  | 'columnheader'
  | 'combobox'
  | 'complementary'
  | 'contentinfo'
  | 'definition'
  | 'dialog'
  | 'directory'
  | 'document'
  | 'feed'
  | 'figure'
  | 'form'
  | 'grid'
  | 'group'
  | 'heading'
  | 'img'
  | 'link'
  | 'list'
  | 'listitem'
  | 'log'
  | 'main'
  | 'marquee'
  | 'math'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'meter'
  | 'navigation'
  | 'none'
  | 'note'
  | 'option'
  | 'presentation'
  | 'progressbar'
  | 'radio'
  | 'radiogroup'
  | 'region'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'scrollbar'
  | 'searchbox'
  | 'separator'
  | 'slider'
  | 'spinbutton'
  | 'status'
  | 'summary'
  | 'switch'
  | 'tab'
  | 'table'
  | 'tablist'
  | 'tabpanel'
  | 'term'
  | 'timer'
  | 'toolbar'
  | 'tooltip'
  | 'tree'
  | 'treegrid'
  | 'treeitem';

export type AccessibilityActionName =
  /**
   * Generated when a screen reader user double taps the component.
   */
  | 'activate'
  /**
   * Generated when a screen reader user increments an adjustable component.
   */
  | 'increment'
  /**
   * Generated when a screen reader user decrements an adjustable component.
   */
  | 'decrement'
  /**
   * Generated when a TalkBack user places accessibility focus on the component and double taps and holds one finger on the screen.
   * @platform android
   */
  | 'longpress'
  /**
   * Generated when a VoiceOver user places focus on or inside the component and double taps with two fingers.
   * @platform ios
   * */
  | 'magicTap'
  /**
   * Generated when a VoiceOver user places focus on or inside the component and performs a two finger scrub gesture (left, right, left).
   * @platform ios
   * */
  | 'escape';

// the info associated with an accessibility action
export type AccessibilityActionInfo = Readonly<{
  name: AccessibilityActionName | string,
  label?: string,
  ...
}>;

// The info included in the event sent to onAccessibilityAction
export type AccessibilityActionEvent = NativeSyntheticEvent<
  Readonly<{actionName: string, ...}>,
>;

export type AccessibilityState = {
  /**
   * When true, informs accessible tools if the element is disabled
   */
  disabled?: ?boolean,
  /**
   * When true, informs accessible tools if the element is selected
   */
  selected?: ?boolean,
  /**
   * For items like Checkboxes and Toggle switches, reports their state to accessible tools
   */
  checked?: ?boolean | 'mixed',
  /**
   *  When present, informs accessible tools if the element is busy
   */
  busy?: ?boolean,
  /**
   *  When present, informs accessible tools the element is expanded or collapsed
   */
  expanded?: ?boolean,
  ...
};

export type AccessibilityValue = Readonly<{
  /**
   * The minimum value of this component's range. (should be an integer)
   */
  min?: number,

  /**
   * The maximum value of this component's range. (should be an integer)
   */
  max?: number,

  /**
   * The current value of this component's range. (should be an integer)
   */
  now?: number,

  /**
   * A textual description of this component's value. (will override minimum, current, and maximum if set)
   */
  text?: Stringish,
}>;

export type AccessibilityPropsAndroid = Readonly<{
  /**
   * Identifies the element that labels the element it is applied to. When the assistive technology focuses on the component with this props,
   * the text is read aloud. The value should should match the nativeID of the related element.
   *
   * @platform android
   */
  accessibilityLabelledBy?: ?string | ?Array<string>,

  /**
   * Identifies the element that labels the element it is applied to. When the assistive technology focuses on the component with this props,
   * the text is read aloud. The value should should match the nativeID of the related element.
   *
   * @platform android
   */
  'aria-labelledby'?: ?string,

  /**
   * Indicates to accessibility services whether the user should be notified
   * when this view changes. Works for Android API >= 19 only.
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/view#accessibilityliveregion
   */
  accessibilityLiveRegion?: ?('none' | 'polite' | 'assertive'),

  /**
   * Indicates to accessibility services whether the user should be notified
   * when this view changes. Works for Android API >= 19 only.
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/view#accessibilityliveregion
   */
  'aria-live'?: ?('polite' | 'assertive' | 'off'),

  /**
   * Controls how view is important for accessibility which is if it
   * fires accessibility events and if it is reported to accessibility services
   * that query the screen. Works for Android only.
   *
   * @platform android
   *
   * See https://reactnative.dev/docs/view#importantforaccessibility
   */
  importantForAccessibility?: ?('auto' | 'yes' | 'no' | 'no-hide-descendants'),

  /**
   * Enables the view to be screen reader focusable, not keyboard focusable. This has lower priority
   * than focusable or accessible props.
   *
   * @platform android
   */
  screenReaderFocusable?: boolean,
}>;

export type AccessibilityPropsIOS = Readonly<{
  /**
   * Prevents view from being inverted if set to true and color inversion is turned on.
   *
   * @platform ios
   */
  accessibilityIgnoresInvertColors?: ?boolean,

  /**
   * A value indicating whether VoiceOver should ignore the elements
   * within views that are siblings of the receiver.
   * Default is `false`.
   *
   * @platform ios
   *
   * See https://reactnative.dev/docs/view#accessibilityviewismodal
   */
  accessibilityViewIsModal?: ?boolean,

  /**
   * @platform ios
   *
   * See https://reactnative.dev/docs/view#accessibilityshowslargecontentviewer
   */
  accessibilityShowsLargeContentViewer?: ?boolean,

  /**
   * @platform ios
   *
   * See https://reactnative.dev/docs/view#accessibilitylargecontenttitle
   */
  accessibilityLargeContentTitle?: ?string,

  /**
   * The aria-modal attribute indicates content contained within a modal with aria-modal="true"
   * should be accessible to the user.
   * Default is `false`.
   *
   *  @platform ios
   */
  'aria-modal'?: ?boolean,

  /**
   * A value indicating whether the accessibility elements contained within
   * this accessibility element are hidden.
   *
   * @platform ios
   *
   * See https://reactnative.dev/docs/view#accessibilityElementsHidden
   */
  accessibilityElementsHidden?: ?boolean,

  /**
   * Indicates to the accessibility services that the UI component is in
   * a specific language. The provided string should be formatted following
   * the BCP 47 specification (https://www.rfc-editor.org/info/bcp47).
   *
   * @platform ios
   */
  accessibilityLanguage?: ?Stringish,

  /**
   * Blocks the user from interacting with the component through keyboard while still allowing
   * screen reader to interact with it if this View is still accessible.
   *
   * @platform ios
   */
  accessibilityRespondsToUserInteraction?: ?boolean,
}>;

export type AccessibilityProps = Readonly<{
  ...AccessibilityPropsAndroid,
  ...AccessibilityPropsIOS,
  /**
   * When `true`, indicates that the view is an accessibility element.
   * By default, all the touchable elements are accessible.
   *
   * See https://reactnative.dev/docs/view#accessible
   */
  accessible?: ?boolean,

  /**
   * Overrides the text that's read by the screen reader when the user interacts
   * with the element. By default, the label is constructed by traversing all
   * the children and accumulating all the `Text` nodes separated by space.
   *
   * See https://reactnative.dev/docs/view#accessibilitylabel
   */
  accessibilityLabel?: ?Stringish,

  /**
   * An accessibility hint helps users understand what will happen when they perform
   * an action on the accessibility element when that result is not obvious from the
   * accessibility label.
   *
   *
   * See https://reactnative.dev/docs/view#accessibilityHint
   */
  accessibilityHint?: ?Stringish,

  /**
   * Alias for accessibilityLabel  https://reactnative.dev/docs/view#accessibilitylabel
   * https://github.com/facebook/react-native/issues/34424
   */
  'aria-label'?: ?Stringish,

  /**
   * Indicates to accessibility services to treat UI component like a specific role.
   */
  accessibilityRole?: ?AccessibilityRole,

  /**
   * Alias for accessibilityRole
   */
  role?: ?Role,

  /**
   * Indicates to accessibility services that UI Component is in a specific State.
   */
  accessibilityState?: ?AccessibilityState,
  accessibilityValue?: ?AccessibilityValue,

  /**
   * alias for accessibilityState
   * It represents textual description of a component's value, or for range-based components, such as sliders and progress bars.
   */
  'aria-valuemax'?: ?AccessibilityValue['max'],
  'aria-valuemin'?: ?AccessibilityValue['min'],
  'aria-valuenow'?: ?AccessibilityValue['now'],
  'aria-valuetext'?: ?AccessibilityValue['text'],

  /**
   * Provides an array of custom actions available for accessibility.
   *
   */
  accessibilityActions?: ?ReadonlyArray<AccessibilityActionInfo>,

  /**
   * alias for accessibilityState
   *
   * see https://reactnative.dev/docs/accessibility#accessibilitystate
   */
  'aria-busy'?: ?boolean,
  'aria-checked'?: ?boolean | 'mixed',
  'aria-disabled'?: ?boolean,
  'aria-expanded'?: ?boolean,
  'aria-selected'?: ?boolean,
  /** A value indicating whether the accessibility elements contained within
   * this accessibility element are hidden.
   *
   * See https://reactnative.dev/docs/view#aria-hidden
   */
  'aria-hidden'?: ?boolean,
}>;
