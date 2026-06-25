/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const I18nManager =
  require('../../../../../Libraries/ReactNative/I18nManager').default;

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
  style: Object,
): ?Readonly<{
  bottom: number,
  left: number,
  right: number,
  top: number,
}> {
  let hasParts = false;
  const result = {
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  };

  // TODO: Fix issues with multiple properties affecting the same side.

  const styleForAll = style[prefix];
  if (styleForAll != null) {
    for (const key of Object.keys(result)) {
      result[key] = styleForAll;
    }
    hasParts = true;
  }

  const styleForHorizontal = style[prefix + 'Horizontal'];
  if (styleForHorizontal != null) {
    result.left = styleForHorizontal;
    result.right = styleForHorizontal;
    hasParts = true;
  } else {
    const styleForLeft = style[prefix + 'Left'];
    if (styleForLeft != null) {
      result.left = styleForLeft;
      hasParts = true;
    }

    const styleForRight = style[prefix + 'Right'];
    if (styleForRight != null) {
      result.right = styleForRight;
      hasParts = true;
    }

    const styleForEnd = style[prefix + 'End'];
    if (styleForEnd != null) {
      const constants = I18nManager.getConstants();
      if (constants.isRTL && constants.doLeftAndRightSwapInRTL) {
        result.left = styleForEnd;
      } else {
        result.right = styleForEnd;
      }
      hasParts = true;
    }
    const styleForStart = style[prefix + 'Start'];
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

  const styleForVertical = style[prefix + 'Vertical'];
  if (styleForVertical != null) {
    result.bottom = styleForVertical;
    result.top = styleForVertical;
    hasParts = true;
  } else {
    const styleForBottom = style[prefix + 'Bottom'];
    if (styleForBottom != null) {
      result.bottom = styleForBottom;
      hasParts = true;
    }

    const styleForTop = style[prefix + 'Top'];
    if (styleForTop != null) {
      result.top = styleForTop;
      hasParts = true;
    }
  }

  return hasParts ? result : null;
}

export default resolveBoxStyle;
