/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import getSafeAreaContentPadding from '../getSafeAreaContentPadding';

const INSETS = {top: 44, right: 84, bottom: 34, left: 0};

// Every other key on the row is reset, so that only the logical keys apply.
const ROW_KEYS_UNSET = {
  paddingLeft: null,
  paddingRight: null,
  paddingHorizontal: null,
  paddingInline: null,
  paddingInlineStart: null,
  paddingInlineEnd: null,
};

describe('getSafeAreaContentPadding', () => {
  const I18nManager =
    require('../../../../../Libraries/ReactNative/I18nManager').default;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('pads across the scrollable axis of a vertical scroll view', () => {
    expect(getSafeAreaContentPadding(null, INSETS, false)).toEqual({
      paddingStart: undefined,
      paddingEnd: 84,
      ...ROW_KEYS_UNSET,
    });
  });

  test('pads across the scrollable axis of a horizontal scroll view', () => {
    expect(getSafeAreaContentPadding(null, INSETS, true)).toEqual({
      paddingTop: 44,
      paddingBottom: 34,
    });
  });

  test('is null when the axis has no safe area', () => {
    expect(
      getSafeAreaContentPadding(
        {padding: 10},
        {top: 44, right: 0, bottom: 34, left: 0},
        false,
      ),
    ).toBeNull();
    expect(
      getSafeAreaContentPadding(
        {padding: 10},
        {top: 0, right: 84, bottom: 0, left: 0},
        true,
      ),
    ).toBeNull();
  });

  test('adds to the padding the style resolves to on each edge', () => {
    expect(
      getSafeAreaContentPadding(
        [{padding: 10}, {paddingHorizontal: 12}, {paddingRight: 20}],
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 12, paddingEnd: 104, ...ROW_KEYS_UNSET});
    expect(
      getSafeAreaContentPadding({padding: 10, paddingTop: 5}, INSETS, true),
    ).toEqual({paddingTop: 49, paddingBottom: 44});
  });

  test('resolves the inline and block aliases as Fabric does', () => {
    // `paddingInline` applies over `paddingHorizontal`, and `paddingInlineEnd`
    // over `paddingEnd`.
    expect(
      getSafeAreaContentPadding(
        {paddingHorizontal: 12, paddingInline: 16, paddingEnd: 20},
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 16, paddingEnd: 104, ...ROW_KEYS_UNSET});
    expect(
      getSafeAreaContentPadding(
        {paddingEnd: 20, paddingInlineEnd: 30},
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: undefined, paddingEnd: 114, ...ROW_KEYS_UNSET});
    // `paddingBlockStart` applies under `paddingTop` and over `paddingBlock`,
    // which applies over `paddingVertical`.
    expect(
      getSafeAreaContentPadding(
        {
          paddingTop: 5,
          paddingBlockStart: 8,
          paddingVertical: 2,
          paddingBlock: 3,
        },
        INSETS,
        true,
      ),
    ).toEqual({paddingTop: 49, paddingBottom: 37});
  });

  test('prefers the logical edge the style sets', () => {
    expect(
      getSafeAreaContentPadding(
        {paddingLeft: 10, paddingStart: 30},
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 30, paddingEnd: 84, ...ROW_KEYS_UNSET});
  });

  test('keeps a value that is not a number on an edge with no inset', () => {
    expect(
      getSafeAreaContentPadding({paddingHorizontal: '5%'}, INSETS, false),
    ).toEqual({paddingStart: '5%', paddingEnd: 84, ...ROW_KEYS_UNSET});
  });

  test('keeps physical insets on their edge in RTL', () => {
    jest.spyOn(I18nManager, 'getConstants').mockReturnValue({
      isRTL: true,
      doLeftAndRightSwapInRTL: true,
      localeIdentifier: 'ar',
    });
    // The right inset lands on the leading edge, which is the start in RTL,
    // and a `paddingLeft` the style sets is swapped to the physical right,
    // over the `paddingStart` it also sets.
    expect(
      getSafeAreaContentPadding(
        {paddingLeft: 10, paddingStart: 30, paddingEnd: 5},
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 94, paddingEnd: 5, ...ROW_KEYS_UNSET});
  });

  test('keeps physical edges in RTL without the left and right swap', () => {
    jest.spyOn(I18nManager, 'getConstants').mockReturnValue({
      isRTL: true,
      doLeftAndRightSwapInRTL: false,
      localeIdentifier: 'ar',
    });
    expect(
      getSafeAreaContentPadding(
        {paddingLeft: 10, paddingRight: 20},
        INSETS,
        false,
      ),
    ).toEqual({paddingStart: 104, paddingEnd: 10, ...ROW_KEYS_UNSET});
  });
});
