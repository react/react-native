/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagValue} from './types';

export function getCxxTypeFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return 'bool';
    case 'number':
      return 'double';
    case 'string':
      return 'std::string';
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export function getCxxValueFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return defaultValue.toString();
    case 'number':
      const numericString = defaultValue.toString();
      // If the number is an integer, we need to append ".0" so that the result
      // is interpreted as a double in C++.
      return numericString.includes('.') ? numericString : `${numericString}.0`;
    case 'string':
      return JSON.stringify(defaultValue);
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export function getCxxFollyDynamicAccessorFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return 'getBool';
    case 'number':
      return 'getDouble';
    case 'string':
      return 'getString';
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export function getCxxJNITypeFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return 'jboolean';
    case 'number':
      return 'jdouble';
    case 'string':
      return 'jstring';
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export function getKotlinTypeFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return 'Boolean';
    case 'number':
      return 'Double';
    case 'string':
      return 'String';
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export function getKotlinValueFromDefaultValue(
  defaultValue: FeatureFlagValue,
): string {
  switch (typeof defaultValue) {
    case 'boolean':
      return defaultValue.toString();
    case 'number':
      const numericString = defaultValue.toString();
      // If the number is an integer, we need to append ".0" so that the result
      // is interpreted as a double in Kotlin.
      return numericString.includes('.') ? numericString : `${numericString}.0`;
    case 'string':
      return JSON.stringify(defaultValue);
    default:
      throw new Error(`Unsupported default value type: ${typeof defaultValue}`);
  }
}

export const DO_NOT_MODIFY_COMMENT = `/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags --update
 */`;
