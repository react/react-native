/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../../../../Libraries/StyleSheet/StyleSheet';
import type {DimensionValue} from '../../../../Libraries/StyleSheet/StyleSheetTypes';
import type {SafeAreaInsets} from '../../../../Libraries/Types/CoreEventTypes';

import I18nManager from '../../../../Libraries/ReactNative/I18nManager';
import flattenStyle from '../../../../Libraries/StyleSheet/flattenStyle';

type PhysicalEdge = 'top' | 'right' | 'bottom' | 'left';
type FlatStyle = ?{readonly [key: string]: unknown, ...};
type PaddingValue = DimensionValue | void;

/**
 * The padding keys that apply to one physical edge, most specific first, as
 * Fabric resolves them: the `paddingInline*` and `paddingBlock*` aliases are
 * applied over the keys they alias, and in RTL with `doLeftAndRightSwapInRTL`
 * the physical left and right keys are copied over the logical start and end
 * keys after everything else.
 */
function getPaddingKeys(edge: PhysicalEdge, isRTL: boolean): Array<string> {
  if (edge === 'top') {
    return [
      'paddingTop',
      'paddingBlockStart',
      'paddingBlock',
      'paddingVertical',
      'padding',
    ];
  }
  if (edge === 'bottom') {
    return [
      'paddingBottom',
      'paddingBlockEnd',
      'paddingBlock',
      'paddingVertical',
      'padding',
    ];
  }
  const {doLeftAndRightSwapInRTL} = I18nManager.getConstants();
  const swap = isRTL && doLeftAndRightSwapInRTL;
  const leading = (edge === 'left') !== isRTL;
  const logical = leading
    ? ['paddingInlineStart', 'paddingStart']
    : ['paddingInlineEnd', 'paddingEnd'];
  const physical = (edge === 'left') !== swap ? 'paddingLeft' : 'paddingRight';
  return [
    ...(swap ? [physical, ...logical] : [...logical, physical]),
    'paddingInline',
    'paddingHorizontal',
    'padding',
  ];
}

/**
 * The padding a flattened style sets on one physical edge, or `undefined` when
 * it sets none.
 */
function resolvePadding(
  style: FlatStyle,
  edge: PhysicalEdge,
  isRTL: boolean,
): PaddingValue {
  if (style == null) {
    return undefined;
  }
  for (const key of getPaddingKeys(edge, isRTL)) {
    const value = style[key];
    if (typeof value === 'number' || typeof value === 'string') {
      return value;
    }
  }
  return undefined;
}

/**
 * The padding the style resolves to on an edge, grown by that edge's inset.
 * A value that is not a plain number, such as a percentage, keeps its meaning
 * only where the inset is 0; on an inset edge it resolves to 0.
 */
function padEdge(value: PaddingValue, inset: number): PaddingValue {
  if (inset === 0) {
    return value;
  }
  return (typeof value === 'number' ? value : 0) + inset;
}

/**
 * Padding that keeps a scroll view's content container clear of the safe area
 * on the axis the scroll view does not scroll along, on top of the padding its
 * style already has, or `null` when that axis has no safe area to clear.
 *
 * Across the row the logical keys carry the result, and the other keys on that
 * axis are set to `null`: every one of them can otherwise take precedence over
 * the logical keys once Fabric resolves the style, and `null` reaches native as
 * a reset where `undefined` is left out of the props diff. The column needs no
 * such care, since the physical keys take precedence over everything else
 * there.
 */
export default function getSafeAreaContentPadding(
  contentContainerStyle: ViewStyleProp,
  insets: SafeAreaInsets,
  horizontal: boolean,
): ViewStyleProp {
  const style: FlatStyle = flattenStyle(contentContainerStyle);
  if (horizontal) {
    if (insets.top === 0 && insets.bottom === 0) {
      return null;
    }
    return {
      paddingTop: padEdge(resolvePadding(style, 'top', false), insets.top),
      paddingBottom: padEdge(
        resolvePadding(style, 'bottom', false),
        insets.bottom,
      ),
    };
  }
  if (insets.left === 0 && insets.right === 0) {
    return null;
  }
  const isRTL = I18nManager.getConstants().isRTL;
  const left = padEdge(resolvePadding(style, 'left', isRTL), insets.left);
  const right = padEdge(resolvePadding(style, 'right', isRTL), insets.right);
  return {
    paddingStart: isRTL ? right : left,
    paddingEnd: isRTL ? left : right,
    paddingLeft: null,
    paddingRight: null,
    paddingHorizontal: null,
    paddingInline: null,
    paddingInlineStart: null,
    paddingInlineEnd: null,
  };
}
