/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {____DangerouslyImpreciseStyle_Internal} from './StyleSheetTypes';

import flattenStyle from './flattenStyle';

const MEDIA_PREFIX = '@media';
const MEDIA_PREFIX_REGEX = /^@media\b/i;
const AT_SIGN = 0x40; // '@'

function startsWithMediaPrefix(key: string): boolean {
  return key.charCodeAt(0) === AT_SIGN && MEDIA_PREFIX_REGEX.test(key);
}

const AND_KEYWORD_REGEX = /^and\b/i;
const CONDITION_GROUP_REGEX = /^\(\s*([a-zA-Z-]+)\s*:\s*([^():]*?)\s*\)/;

type MediaQueryCondition = Readonly<{
  colorScheme?: 'light' | 'dark',
  orientation?: 'portrait' | 'landscape',
}>;

export type StyleCondition = Readonly<{
  query: MediaQueryCondition,
  value: unknown,
}>;

export type StyleConditionsMap = Readonly<{
  [property: string]: ReadonlyArray<StyleCondition>,
}>;

const processedStyleConditionsCache: WeakMap<
  Partial<____DangerouslyImpreciseStyle_Internal>,
  Partial<____DangerouslyImpreciseStyle_Internal>,
> = new WeakMap();

// Parses a media query string (with or without a leading `@media`) into the
// structured condition matched against natively. Returns null if unrecognized.
export function parseMediaQueryString(
  queryString: string,
): MediaQueryCondition | null {
  let remaining = queryString.trim();

  const prefixMatch = MEDIA_PREFIX_REGEX.exec(remaining);
  if (prefixMatch != null) {
    remaining = remaining.slice(prefixMatch[0].length).trim();
  }

  if (remaining === '') {
    return null;
  }

  const condition: {
    colorScheme?: 'light' | 'dark',
    orientation?: 'portrait' | 'landscape',
  } = {};

  let isFirstGroup = true;
  while (remaining !== '') {
    if (!isFirstGroup) {
      const andMatch = AND_KEYWORD_REGEX.exec(remaining);
      if (andMatch == null) {
        return null;
      }
      remaining = remaining.slice(andMatch[0].length).trim();
    }

    const groupMatch = CONDITION_GROUP_REGEX.exec(remaining);
    if (groupMatch == null) {
      return null;
    }

    const feature = groupMatch[1].toLowerCase();
    const rawValue = groupMatch[2].toLowerCase();

    if (feature === 'prefers-color-scheme') {
      if (rawValue !== 'light' && rawValue !== 'dark') {
        return null;
      }
      condition.colorScheme = rawValue;
    } else if (feature === 'orientation') {
      if (rawValue !== 'portrait' && rawValue !== 'landscape') {
        return null;
      }
      condition.orientation = rawValue;
    } else {
      return null;
    }

    remaining = remaining.slice(groupMatch[0].length).trim();
    isFirstGroup = false;
  }

  return condition;
}

export function looksLikeStyleConditionValue(value: unknown): boolean {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return false;
  }
  const entries = value as {readonly [key: string]: unknown};
  for (const key in entries) {
    if (startsWithMediaPrefix(key)) {
      return true;
    }
  }
  return false;
}

/**
 * Compiles the authored form of a conditional style value into its default
 * value plus a list of conditions
 */
export function compileStyleConditionValue(
  value: {readonly [key: string]: unknown},
  propertyName: string,
): {default: unknown, conditions: Array<StyleCondition>} | null {
  if (!('default' in value)) {
    if (__DEV__) {
      console.error(
        `StyleSheet: conditional value for "${propertyName}" is missing the ` +
          "required 'default' key (use `default: null` for no value).",
      );
    }
    return null;
  }

  const conditions: Array<StyleCondition> = [];
  for (const key in value) {
    if (key === 'default') {
      continue;
    }
    const query = MEDIA_PREFIX_REGEX.test(key)
      ? parseMediaQueryString(key.slice(MEDIA_PREFIX.length))
      : null;
    if (query == null) {
      if (__DEV__) {
        console.error(
          `StyleSheet: invalid media query "${key}" in the conditional ` +
            `value for "${propertyName}". Every key other than 'default' ` +
            "must be a valid '@media (…)' string.",
        );
      }
      return null;
    }
    conditions.push({query, value: value[key]});
  }

  if (conditions.length === 0) {
    if (__DEV__) {
      console.error(
        `StyleSheet: conditional value for "${propertyName}" has no ` +
          "'@media (…)' conditions.",
      );
    }
    return null;
  }

  return {default: value.default, conditions};
}

/**
 * Rewrites a flat style object so that conditional values become an inline
 * default plus a single `styleConditions` object keyed by property.
 */
export default function processStyleConditions(
  style: Partial<____DangerouslyImpreciseStyle_Internal>,
): Partial<____DangerouslyImpreciseStyle_Internal> {
  const cachedStyle = processedStyleConditionsCache.get(style);
  if (cachedStyle != null) {
    return cachedStyle;
  }

  const styleEntries = style as $FlowFixMe as {
    readonly [key: string]: unknown,
  };

  let result: {[key: string]: unknown} | null = null;
  const conditionsByProperty: {
    [property: string]: ReadonlyArray<StyleCondition>,
  } = {};
  let hasConditions = false;

  for (const key in styleEntries) {
    const value = styleEntries[key];
    if (!looksLikeStyleConditionValue(value)) {
      continue;
    }
    const compiled = compileStyleConditionValue(
      value as $FlowFixMe as {readonly [key: string]: unknown},
      key,
    );
    if (result == null) {
      result = {...styleEntries};
    }
    if (compiled == null) {
      // Invalid conditional value: drop the property rather than shipping a
      // value native cannot interpret.
      delete result[key];
      continue;
    }
    // Inline the default (a normal value, parsed and processed like any
    // other), and collect the conditions under the property's key on the
    // single `styleConditions` prop.
    result[key] = compiled.default;
    if (__DEV__) {
      for (const condition of compiled.conditions) {
        Object.freeze(condition.query);
        Object.freeze(condition);
      }
      Object.freeze(compiled.conditions);
    }
    conditionsByProperty[key] = compiled.conditions;
    hasConditions = true;
  }

  if (result == null) {
    processedStyleConditionsCache.set(style, style);
    return style;
  }
  if (hasConditions) {
    result.styleConditions = __DEV__
      ? Object.freeze(conditionsByProperty)
      : conditionsByProperty;
  }
  const processedStyle =
    result as $FlowFixMe as Partial<____DangerouslyImpreciseStyle_Internal>;
  processedStyleConditionsCache.set(style, processedStyle);
  return processedStyle;
}

function stylePropNeedsProcessing(style: unknown): boolean {
  if (style === null || typeof style !== 'object') {
    return false;
  }

  if (Array.isArray(style)) {
    for (let i = 0, length = style.length; i < length; i++) {
      if (stylePropNeedsProcessing(style[i])) {
        return true;
      }
    }
    return false;
  }

  return (
    processStyleConditions(
      style as $FlowFixMe as Partial<____DangerouslyImpreciseStyle_Internal>,
    ) !== style
  );
}

// Used by ReactNativeAttributePayload on a `style` prop: compiles its
// conditional (media-query) values, or returns it unchanged if it has none.
export function processStyleConditionsInStyleProp(style: unknown): unknown {
  if (style === null || typeof style !== 'object') {
    return style;
  }

  if (!stylePropNeedsProcessing(style)) {
    return style;
  }

  const flatStyle = flattenStyle(
    style as $FlowFixMe as ____DangerouslyImpreciseStyle_Internal,
  );
  return flatStyle == null ? undefined : processStyleConditions(flatStyle);
}

// `process` for the `styleConditions` style attribute: runs each condition's
// value through its property processor (e.g. processColor).
export function processStyleConditionsProp(value: unknown): unknown {
  if (typeof value !== 'object' || value == null || Array.isArray(value)) {
    return value;
  }
  // Lazily require to avoid an import cycle through `ReactNativeStyleAttributes`
  // (which registers this processor).
  const ReactNativeStyleAttributes =
    require('../Components/View/ReactNativeStyleAttributes').default;

  const conditionsByProperty = value as $FlowFixMe as StyleConditionsMap;
  const result: {[property: string]: ReadonlyArray<StyleCondition>} = {};
  for (const property in conditionsByProperty) {
    const attributeConfig = ReactNativeStyleAttributes[property];
    const process =
      typeof attributeConfig === 'object' &&
      typeof attributeConfig.process === 'function'
        ? attributeConfig.process
        : null;
    result[property] = conditionsByProperty[property].map(
      (condition: StyleCondition) => ({
        query: condition.query,
        value:
          process != null && condition.value != null
            ? process(condition.value)
            : condition.value,
      }),
    );
  }
  return result;
}
