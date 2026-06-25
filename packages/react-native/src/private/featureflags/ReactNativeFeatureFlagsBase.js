/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  ReactNativeFeatureFlagsJsOnly,
  ReactNativeFeatureFlagsJsOnlyOverrides,
} from './ReactNativeFeatureFlags';

import NativeReactNativeFeatureFlags from './specs/NativeReactNativeFeatureFlags';

const accessedFeatureFlags: Set<string> = new Set();
let overrides: ?ReactNativeFeatureFlagsJsOnlyOverrides;

// This is a list of functions to clear the cached value for each feature flag
// getter. This is only used in development.
const clearCachedValuesFns: Array<() => void> = [];

export type Getter<T> = () => T;

// This defines the types for the overrides object, whose methods can return
// null or undefined to fallback to the default value.
export type OverridesFor<T> = Partial<{
  [key in keyof T]: Getter<?ReturnType<T[key]>>,
}>;

function createGetter<T extends boolean | number | string>(
  configName: string,
  customValueGetter: Getter<?T>,
  defaultValue: T,
): Getter<T> {
  let cachedValue: ?T;

  if (__DEV__) {
    clearCachedValuesFns.push(() => {
      cachedValue = undefined;
    });
  }

  return () => {
    if (cachedValue == null) {
      cachedValue = customValueGetter() ?? defaultValue;
    }
    return cachedValue;
  };
}

export function createJavaScriptFlagGetter<
  K extends keyof ReactNativeFeatureFlagsJsOnly,
>(
  configName: K,
  defaultValue: ReturnType<ReactNativeFeatureFlagsJsOnly[K]>,
): Getter<ReturnType<ReactNativeFeatureFlagsJsOnly[K]>> {
  return createGetter(
    configName,
    () => {
      accessedFeatureFlags.add(configName);
      return overrides?.[configName]?.();
    },
    defaultValue,
  );
}

type NativeFeatureFlags = NonNullable<typeof NativeReactNativeFeatureFlags>;

export function createNativeFlagGetter<K extends keyof NativeFeatureFlags>(
  configName: K,
  defaultValue: ReturnType<NonNullable<NativeFeatureFlags[K]>>,
  skipUnavailableNativeModuleError: boolean = false,
): Getter<ReturnType<NonNullable<NativeFeatureFlags[K]>>> {
  return createGetter(
    configName,
    () => {
      maybeLogUnavailableNativeModuleError(configName);
      return NativeReactNativeFeatureFlags?.[configName]?.();
    },
    defaultValue,
  );
}

export function getOverrides(): ?ReactNativeFeatureFlagsJsOnlyOverrides {
  return overrides;
}

export function setOverrides(
  newOverrides: ReactNativeFeatureFlagsJsOnlyOverrides,
): void {
  if (overrides != null) {
    throw new Error('Feature flags cannot be overridden more than once');
  }

  if (accessedFeatureFlags.size > 0) {
    const accessedFeatureFlagsStr = Array.from(accessedFeatureFlags).join(', ');
    throw new Error(
      `Feature flags were accessed before being overridden: ${accessedFeatureFlagsStr}`,
    );
  }

  overrides = newOverrides;
}

const reportedConfigNames: Set<string> = new Set();
const hasTurboModules =
  global.RN$Bridgeless === true || global.__turboModuleProxy != null;

function maybeLogUnavailableNativeModuleError(configName: string): void {
  if (
    !NativeReactNativeFeatureFlags &&
    // Don't log in tests.
    process.env.NODE_ENV !== 'test' &&
    // Don't log more than once per config
    !reportedConfigNames.has(configName) &&
    // Don't log in the legacy architecture.
    hasTurboModules
  ) {
    reportedConfigNames.add(configName);
    console.error(
      `Could not access feature flag '${configName}' because native module method was not available`,
    );
  }
}

export function dangerouslyResetForTesting(): void {
  if (__DEV__) {
    overrides = null;
    accessedFeatureFlags.clear();
    reportedConfigNames.clear();
    clearCachedValuesFns.forEach(fn => fn());
  }
}
