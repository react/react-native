/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

export type MediaQuery = Readonly<{
  colorScheme: 'light' | 'dark',
}>;

export type StyleCondition = Readonly<{
  query: MediaQuery,
  value: unknown,
}>;

export type CompiledConditionalValue = Readonly<{
  default: unknown,
  conditions: ReadonlyArray<StyleCondition>,
}>;

export type StyleObject = {readonly [key: string]: unknown};

const MEDIA_QUERY_REGEX =
  /^@media\s*\(\s*prefers-color-scheme\s*:\s*([a-z]+)\s*\)$/i;
const MEDIA_KEY_REGEX = /^@media\b/i;

export function parseMediaQuery(key: string): MediaQuery | null {
  const match = MEDIA_QUERY_REGEX.exec(key.trim());
  if (match == null) {
    return null;
  }
  const colorScheme = match[1].toLowerCase();
  if (colorScheme !== 'light' && colorScheme !== 'dark') {
    return null;
  }
  return {colorScheme};
}

export function compileConditionalValue(
  value: StyleObject,
  property: string,
): CompiledConditionalValue | null {
  if (value.default === undefined) {
    if (__DEV__) {
      console.error(
        `StyleSheet: the conditional value of "${property}" needs a ` +
          "'default' key. Use `default: null` for no value.",
      );
    }
    return null;
  }

  const conditions: Array<StyleCondition> = [];
  for (const key in value) {
    if (key === 'default') {
      continue;
    }
    const query = parseMediaQuery(key);
    if (query == null) {
      if (__DEV__) {
        console.error(
          `StyleSheet: "${key}" in the conditional value of "${property}" ` +
            'is not a supported media query. It is ignored.',
        );
      }
      continue;
    }
    conditions.push({query, value: value[key]});
  }

  return {default: value.default, conditions};
}

// Looks like a conditional value. `compileConditionalValue` checks the rules.
export function isConditionalValue(
  value: unknown,
): implies value is StyleObject {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return false;
  }
  for (const key in value as StyleObject) {
    if (key === 'default' || MEDIA_KEY_REGEX.test(key)) {
      return true;
    }
  }
  return false;
}
