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

import type {ViewStyleProp} from '../../../../../Libraries/StyleSheet/StyleSheet';

const I18nManager =
  require('../../../../../Libraries/ReactNative/I18nManager').default;
const flattenStyle =
  require('../../../../../Libraries/StyleSheet/flattenStyle').default;

/**
 * Resolve a style property into its component parts.
 *
 * For example:
 *
 *   > resolveProperties('margin', {margin: 5, marginBottom: 10})
 *   {top: 5, left: 5, right: 5, bottom: 10}
 *
 * If no parts exist, this returns null.
 */
function resolveBoxStyle(
  prefix: string,
  style: ?ViewStyleProp,
): ?Readonly<{
  bottom: number | string,
  left: number | string,
  right: number | string,
  top: number | string,
}> {
  const flatStyle: ?Readonly<{[string]: unknown}> = flattenStyle(style);
  if (flatStyle == null) {
    return null;
  }

  const getStyleValue = (key: string): number | string | null => {
    const value = flatStyle[key];
    return typeof value === 'number' || typeof value === 'string'
      ? value
      : null;
  };

  let hasParts = false;
  const result: {
    bottom: number | string,
    left: number | string,
    right: number | string,
    top: number | string,
  } = {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };

  // TODO: Fix issues with multiple properties affecting the same side.

  const styleForAll = getStyleValue(prefix);
  if (styleForAll != null) {
    result.bottom = styleForAll;
    result.left = styleForAll;
    result.right = styleForAll;
    result.top = styleForAll;
    hasParts = true;
  }

  const styleForHorizontal = getStyleValue(prefix + 'Horizontal');
  if (styleForHorizontal != null) {
    result.left = styleForHorizontal;
    result.right = styleForHorizontal;
    hasParts = true;
  } else {
    const styleForLeft = getStyleValue(prefix + 'Left');
    if (styleForLeft != null) {
      result.left = styleForLeft;
      hasParts = true;
    }

    const styleForRight = getStyleValue(prefix + 'Right');
    if (styleForRight != null) {
      result.right = styleForRight;
      hasParts = true;
    }

    const styleForEnd = getStyleValue(prefix + 'End');
    if (styleForEnd != null) {
      const constants = I18nManager.getConstants();
      if (constants.isRTL && constants.doLeftAndRightSwapInRTL) {
        result.left = styleForEnd;
      } else {
        result.right = styleForEnd;
      }
      hasParts = true;
    }
    const styleForStart = getStyleValue(prefix + 'Start');
    if (styleForStart != null) {
      const constants = I18nManager.getConstants();
      if (constants.isRTL && constants.doLeftAndRightSwapInRTL) {
        result.right = styleForStart;
      } else {
        result.left = styleForStart;
      }
      hasParts = true;
    }
  }

  const styleForVertical = getStyleValue(prefix + 'Vertical');
  if (styleForVertical != null) {
    result.bottom = styleForVertical;
    result.top = styleForVertical;
    hasParts = true;
  } else {
    const styleForBottom = getStyleValue(prefix + 'Bottom');
    if (styleForBottom != null) {
      result.bottom = styleForBottom;
      hasParts = true;
    }

    const styleForTop = getStyleValue(prefix + 'Top');
    if (styleForTop != null) {
      result.top = styleForTop;
      hasParts = true;
    }
  }

  return hasParts ? result : null;
}

export default resolveBoxStyle;
