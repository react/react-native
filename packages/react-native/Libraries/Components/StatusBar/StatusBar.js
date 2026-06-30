/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {EventSubscription} from '../../vendor/emitter/EventEmitter';

import * as Appearance from '../../Utilities/Appearance';
import Platform from '../../Utilities/Platform';
import NativeStatusBarManagerAndroid from './NativeStatusBarManagerAndroid';
import NativeStatusBarManagerIOS from './NativeStatusBarManagerIOS';
import * as React from 'react';

/**
 * Status bar style
 */
export type StatusBarStyle = keyof {
  /**
   * Default status bar style (dark for iOS, light for Android)
   */
  default: string,
  /**
   * Automatically picks `light-content` or `dark-content` based on the current
   * color scheme. Updates whenever the color scheme changes.
   */
  auto: string,
  /**
   * Dark background, white texts and icons
   */
  'light-content': string,
  /**
   * Light background, dark texts and icons
   */
  'dark-content': string,
  ...
};

/**
 * Status bar animation
 */
export type StatusBarAnimation = keyof {
  /**
   * No animation
   */
  none: string,
  /**
   * Fade animation
   */
  fade: string,
  /**
   * Slide animation
   */
  slide: string,
  ...
};

export type StatusBarPropsIOS = Readonly<{
  /**
   * The transition effect when showing and hiding the status bar using the
   * `hidden` prop.
   *
   * @default `'fade'`
   * @platform ios
   */
  showHideTransition?: ?('fade' | 'slide' | 'none'),
}>;

type StatusBarBaseProps = Readonly<{
  /**
   * If the status bar is hidden.
   *
   * @default `false`
   */
  hidden?: ?boolean,

  /**
   * If the transition between status bar property changes should be animated.
   * Supported for `barStyle` and `hidden`.
   *
   * @default `false`
   */
  animated?: ?boolean,

  /**
   * Sets the color of the status bar text.
   *
   * @default `'default'`
   */
  barStyle?: ?('default' | 'auto' | 'light-content' | 'dark-content'),
}>;

export type StatusBarProps = Readonly<{
  ...StatusBarPropsIOS,
  ...StatusBarBaseProps,
}>;

type StackProps = {
  barStyle: ?{
    value: StatusBarProps['barStyle'],
    animated: boolean,
  },
  hidden: ?{
    value: boolean,
    animated: boolean,
    transition: StatusBarProps['showHideTransition'],
  },
};

/**
 * Returns the bar style to use when `barStyle` is `'auto'`, picked against
 * the current color scheme.
 */
function getAutoBarStyle(): 'light-content' | 'dark-content' {
  return Appearance.getColorScheme() === 'dark'
    ? 'light-content'
    : 'dark-content';
}

/**
 * Merges the prop stack with the default values, resolving the `'auto'`
 * barStyle to a concrete value.
 */
function mergePropsStack(
  propsStack: Array<Object>,
  defaultValues: Object,
): Object {
  const merged: StackProps = propsStack.reduce(
    (prev, cur) => {
      for (const prop in cur) {
        if (cur[prop] != null) {
          prev[prop] = cur[prop];
        }
      }
      return prev;
    },
    {...defaultValues},
  );

  if (merged.barStyle?.value === 'auto') {
    merged.barStyle = {...merged.barStyle, value: getAutoBarStyle()};
  }

  return merged;
}

/**
 * Returns an object to insert in the props stack from the props
 * and the transition/animation info.
 */
function createStackEntry(props: StatusBarProps): StackProps {
  const animated = props.animated ?? false;
  const showHideTransition = props.showHideTransition ?? 'fade';
  return {
    barStyle:
      props.barStyle != null
        ? {
            value: props.barStyle,
            animated,
          }
        : null,
    hidden:
      props.hidden != null
        ? {
            value: props.hidden,
            animated,
            transition: showHideTransition,
          }
        : null,
  };
}

/**
 * Component to control the app's status bar. The status bar is the zone,
 * typically at the top of the screen, that displays the current time, Wi-Fi and
 * cellular network information, battery level and/or other status icons.
 *
 * Multiple `StatusBar` components can be mounted simultaneously; props merge in
 * mount order.
 *
 * ### Imperative API
 *
 * For cases where using a component is not ideal, there are static methods
 * to manipulate the `StatusBar` display stack. These methods have the same
 * behavior as mounting and unmounting a `StatusBar` component.
 *
 * For example, you can call `StatusBar.pushStackEntry` to update the status bar
 * before launching a third-party native UI component, and then call
 * `StatusBar.popStackEntry` when completed.
 *
 * Example:
 *
 * ```tsx
 * const openThirdPartyBugReporter = async () => {
 *   // The bug reporter has a dark background, so we push a new status bar style.
 *   const stackEntry = StatusBar.pushStackEntry({barStyle: 'light-content'});
 *
 *   // `open` returns a promise that resolves when the UI is dismissed.
 *   await BugReporter.open();
 *
 *   // Don't forget to call `popStackEntry` when you're done.
 *   StatusBar.popStackEntry(stackEntry);
 * };
 * ```
 *
 * There is a legacy imperative API that enables you to manually update the
 * status bar styles. However, the legacy API does not update the internal
 * `StatusBar` display stack, which means that any changes will be overridden
 * whenever a `StatusBar` component is mounted or unmounted.
 *
 * It is strongly advised that you use `pushStackEntry`, `popStackEntry`, or
 * `replaceStackEntry` instead of the static methods beginning with `set`.
 *
 * ### Constants
 *
 * `currentHeight` (Android only) The height of the status bar.
 *
 * @see https://reactnative.dev/docs/statusbar
 */
class StatusBar extends React.Component<StatusBarProps> {
  static _propsStack: Array<StackProps> = [];

  static _defaultProps: any = createStackEntry({
    barStyle: 'default',
    hidden: false,
  });

  // Timer for updating the native module values at the end of the frame.
  static _updateImmediate: ?number = null;

  // The current merged values from the props stack. `barStyle.value` is stored
  // in its resolved form (never `'auto'`), so diff comparisons reflect what
  // was actually sent to the native module.
  static _currentValues: ?StackProps = null;

  // Number of mounted `StatusBar` instances. Used to lazily subscribe to color
  // scheme changes only while at least one instance is on screen.
  static _mountedCount: number = 0;
  static _appearanceSubscription: ?EventSubscription = null;

  // TODO(janic): Provide a real API to deal with status bar height. See the
  // discussion in #6195.
  /**
   * The current height of the status bar on the device.
   *
   * @platform android
   */
  static currentHeight: ?number =
    Platform.OS === 'android'
      ? NativeStatusBarManagerAndroid.getConstants().HEIGHT
      : null;

  // Provide an imperative API as static functions of the component.
  // See the corresponding prop for more detail.

  /**
   * Show or hide the status bar
   * @param hidden Hide the status bar.
   * @param animation Optional animation when
   *    changing the status bar hidden property.
   */
  static setHidden(hidden: boolean, animation?: StatusBarAnimation) {
    animation = animation || 'none';
    StatusBar._defaultProps.hidden.value = hidden;
    if (Platform.OS === 'ios') {
      NativeStatusBarManagerIOS.setHidden(hidden, animation);
    } else if (Platform.OS === 'android') {
      NativeStatusBarManagerAndroid.setHidden(hidden);
    }
  }

  /**
   * Set the status bar style
   * @param style Status bar style to set
   * @param animated Animate the style change.
   */
  static setBarStyle(style: StatusBarStyle, animated?: boolean) {
    animated = animated || false;
    StatusBar._defaultProps.barStyle.value = style;
    const resolvedStyle = style === 'auto' ? getAutoBarStyle() : style;
    if (Platform.OS === 'ios') {
      NativeStatusBarManagerIOS.setStyle(resolvedStyle, animated);
    } else if (Platform.OS === 'android') {
      NativeStatusBarManagerAndroid.setStyle(resolvedStyle);
    }
  }

  /**
   * Push a StatusBar entry onto the stack.
   * The return value should be passed to `popStackEntry` when complete.
   *
   * @param props Object containing the StatusBar props to use in the stack entry.
   */
  static pushStackEntry(props: StatusBarProps): StackProps {
    const entry = createStackEntry(props);
    StatusBar._propsStack.push(entry);
    StatusBar._updatePropsStack();
    return entry;
  }

  /**
   * Pop a StatusBar entry from the stack.
   *
   * @param entry Entry returned from `pushStackEntry`.
   */
  static popStackEntry(entry: StackProps) {
    const index = StatusBar._propsStack.indexOf(entry);
    if (index !== -1) {
      StatusBar._propsStack.splice(index, 1);
    }
    StatusBar._updatePropsStack();
  }

  /**
   * Replace an existing StatusBar stack entry with new props.
   *
   * @param entry Entry returned from `pushStackEntry` to replace.
   * @param props Object containing the StatusBar props to use in the replacement stack entry.
   */
  static replaceStackEntry(
    entry: StackProps,
    props: StatusBarProps,
  ): StackProps {
    const newEntry = createStackEntry(props);
    const index = StatusBar._propsStack.indexOf(entry);
    if (index !== -1) {
      StatusBar._propsStack[index] = newEntry;
    }
    StatusBar._updatePropsStack();
    return newEntry;
  }

  _stackEntry: ?StackProps = null;

  componentDidMount() {
    // Every time a StatusBar component is mounted, we push it's prop to a stack
    // and always update the native status bar with the props from the top of then
    // stack. This allows having multiple StatusBar components and the one that is
    // added last or is deeper in the view hierarchy will have priority.
    this._stackEntry = StatusBar.pushStackEntry(this.props);

    if (StatusBar._mountedCount === 0) {
      // Re-run the native update when the system color scheme changes so any
      // `barStyle: 'auto'` entries resolve to the new appropriate value.
      StatusBar._appearanceSubscription = Appearance.addChangeListener(() => {
        StatusBar._updatePropsStack();
      });
    }

    StatusBar._mountedCount++;
  }

  componentWillUnmount() {
    // When a StatusBar is unmounted, remove itself from the stack and update
    // the native bar with the next props.
    if (this._stackEntry != null) {
      StatusBar.popStackEntry(this._stackEntry);
    }

    StatusBar._mountedCount--;

    if (
      StatusBar._appearanceSubscription != null &&
      StatusBar._mountedCount === 0
    ) {
      StatusBar._appearanceSubscription.remove();
      StatusBar._appearanceSubscription = null;
    }
  }

  componentDidUpdate() {
    if (this._stackEntry != null) {
      this._stackEntry = StatusBar.replaceStackEntry(
        this._stackEntry,
        this.props,
      );
    }
  }

  /**
   * Updates the native status bar with the props from the stack.
   */
  static _updatePropsStack = () => {
    // Send the update to the native module only once at the end of the frame.
    clearImmediate(StatusBar._updateImmediate);
    StatusBar._updateImmediate = setImmediate(() => {
      const oldProps = StatusBar._currentValues;
      const mergedProps = mergePropsStack(
        StatusBar._propsStack,
        StatusBar._defaultProps,
      );

      // Update the props that have changed using the merged values from the props stack.
      if (Platform.OS === 'ios') {
        if (
          !oldProps ||
          oldProps.barStyle?.value !== mergedProps.barStyle.value
        ) {
          NativeStatusBarManagerIOS.setStyle(
            mergedProps.barStyle.value,
            mergedProps.barStyle.animated || false,
          );
        }
        if (!oldProps || oldProps.hidden?.value !== mergedProps.hidden.value) {
          NativeStatusBarManagerIOS.setHidden(
            mergedProps.hidden.value,
            mergedProps.hidden.animated
              ? mergedProps.hidden.transition
              : 'none',
          );
        }
      } else if (Platform.OS === 'android') {
        //todo(T60684787): Add back optimization to only update bar style if the
        //new value is different from the old value.
        NativeStatusBarManagerAndroid.setStyle(mergedProps.barStyle.value);
        if (!oldProps || oldProps.hidden?.value !== mergedProps.hidden.value) {
          NativeStatusBarManagerAndroid.setHidden(mergedProps.hidden.value);
        }
      }
      // Update the current prop values.
      StatusBar._currentValues = mergedProps;
    });
  };

  render(): React.Node {
    return null;
  }
}

export type StatusBarInstance = StatusBar;

export default StatusBar;
