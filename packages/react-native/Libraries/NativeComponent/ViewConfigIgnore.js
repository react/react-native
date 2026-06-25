/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import Platform from '../Utilities/Platform';

const ignoredViewConfigProps = new WeakSet<{...}>();

/**
 * Decorates ViewConfig values that are dynamically injected by the library,
 * react-native-gesture-handler. (T45765076)
 */
export function DynamicallyInjectedByGestureHandler<T extends {...}>(
  object: T,
): T {
  ignoredViewConfigProps.add(object);
  return object;
}

/**
 * On iOS, ViewManager event declarations generate {eventName}: true entries
 * in ViewConfig valueAttributes. These entries aren't generated for Android.
 * This annotation allows Static ViewConfigs to insert these entries into
 * iOS but not Android.
 *
 * In the future, we want to remove this platform-inconsistency. We want
 * to set RN$ViewConfigEventValidAttributesDisabled = true server-side,
 * so that iOS does not generate validAttributes from event props in iOS RCTViewManager,
 * since Android does not generate validAttributes from events props in Android ViewManager.
 *
 * TODO(T110872225): Remove this logic, after achieving platform-consistency
 */
export function ConditionallyIgnoredEventHandlers<
  const T extends {readonly [name: string]: true},
>(value: T): T | void {
  if (Platform.OS === 'ios') {
    return value;
  }
  return undefined;
}

export function isIgnored(value: unknown): boolean {
  if (typeof value === 'object' && value != null) {
    return ignoredViewConfigProps.has(value);
  }
  return false;
}
