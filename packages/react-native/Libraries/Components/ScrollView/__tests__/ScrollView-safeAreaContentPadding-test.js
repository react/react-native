/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof ScrollViewType from '../ScrollView';
import type {ReactTestRenderer} from 'react-test-renderer';

import flattenStyle from '../../../StyleSheet/flattenStyle';
import {create} from '@react-native/jest-preset/jest/renderer';
import * as React from 'react';
import {act} from 'react-test-renderer';

// The real component, in place of the mock the preset installs.
const ScrollView: ScrollViewType = jest.requireActual<{
  default: ScrollViewType,
}>('../ScrollView').default;

const INSETS = {top: 44, right: 84, bottom: 34, left: 0};

function contentContainerStyle(renderer: ReactTestRenderer) {
  return flattenStyle(
    renderer.root.findByType('RCTScrollContentView').props.style,
  );
}

async function dispatchSafeAreaInsetsChange(
  renderer: ReactTestRenderer,
  insets: typeof INSETS,
) {
  const handler =
    renderer.root.findByType('RCTScrollView').props
      .experimental_onSafeAreaInsetsChange;
  await act(async () => {
    handler?.({nativeEvent: {insets}});
  });
}

describe('<ScrollView> safe area content padding', () => {
  test.each(['automatic', 'scrollableAxes', 'always'] as const)(
    'enables native inset correction together with padding under %s',
    async behavior => {
      const renderer = await create(
        <ScrollView contentInsetAdjustmentBehavior={behavior} />,
      );
      expect(
        renderer.root.findByType('RCTScrollView').props.padsContentForSafeArea,
      ).toBe(true);
      await dispatchSafeAreaInsetsChange(renderer, INSETS);
      expect(contentContainerStyle(renderer)).toMatchObject({paddingEnd: 84});

      await act(async () => {
        renderer.update(<ScrollView contentInsetAdjustmentBehavior="never" />);
      });
      expect(
        renderer.root.findByType('RCTScrollView').props.padsContentForSafeArea,
      ).toBe(false);
      expect(contentContainerStyle(renderer)).toEqual({});
    },
  );

  test.each([undefined, null])(
    'resets the native axis when horizontal becomes %s',
    async horizontal => {
      const renderer = await create(
        <ScrollView horizontal contentInsetAdjustmentBehavior="automatic" />,
      );
      await dispatchSafeAreaInsetsChange(renderer, INSETS);
      expect(renderer.root.findByType('RCTScrollView').props.horizontal).toBe(
        true,
      );
      expect(contentContainerStyle(renderer)).toMatchObject({
        paddingTop: 44,
        paddingBottom: 34,
      });

      await act(async () => {
        renderer.update(
          <ScrollView
            horizontal={horizontal}
            contentInsetAdjustmentBehavior="automatic"
          />,
        );
      });
      expect(renderer.root.findByType('RCTScrollView').props.horizontal).toBe(
        false,
      );
      expect(contentContainerStyle(renderer)).toMatchObject({paddingEnd: 84});
    },
  );

  test('keeps native inset correction off when the behavior is omitted', async () => {
    const renderer = await create(<ScrollView />);
    expect(
      renderer.root.findByType('RCTScrollView').props.padsContentForSafeArea,
    ).toBe(false);
  });

  test('pads the content container across the scrollable axis', async () => {
    const renderer = await create(
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{paddingHorizontal: 12, paddingLeft: 10}}
      />,
    );
    expect(contentContainerStyle(renderer)).toEqual({
      paddingHorizontal: 12,
      paddingLeft: 10,
    });

    await dispatchSafeAreaInsetsChange(renderer, INSETS);
    expect(contentContainerStyle(renderer)).toEqual({
      paddingStart: 10,
      paddingEnd: 96,
      paddingLeft: null,
      paddingRight: null,
      paddingHorizontal: null,
      paddingInline: null,
      paddingInlineStart: null,
      paddingInlineEnd: null,
    });
  });

  test('leaves the style alone while the axis has no safe area', async () => {
    const renderer = await create(
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{paddingHorizontal: '5%'}}
      />,
    );
    await dispatchSafeAreaInsetsChange(renderer, {...INSETS, right: 0});
    expect(contentContainerStyle(renderer)).toEqual({paddingHorizontal: '5%'});
  });

  test('renders only when the insets across the scrollable axis change', async () => {
    const renderer = await create(
      <ScrollView contentInsetAdjustmentBehavior="automatic" />,
    );
    const styleOf = () =>
      renderer.root.findByType('RCTScrollContentView').props.style;

    await dispatchSafeAreaInsetsChange(renderer, INSETS);
    const padded = styleOf();
    expect(flattenStyle(padded)).toMatchObject({paddingEnd: 84});

    // A change along the scrollable axis leaves the content container alone.
    await dispatchSafeAreaInsetsChange(renderer, {...INSETS, top: 0});
    expect(styleOf()).toBe(padded);

    await dispatchSafeAreaInsetsChange(renderer, {...INSETS, right: 0});
    expect(styleOf()).not.toBe(padded);
    expect(contentContainerStyle(renderer)).toEqual({});
  });

  test('does not observe the safe area under never', async () => {
    const renderer = await create(
      <ScrollView contentInsetAdjustmentBehavior="never" />,
    );
    const scrollView = renderer.root.findByType('RCTScrollView');
    expect(scrollView.props.experimental_onSafeAreaInsetsChange).toBe(
      undefined,
    );
  });

  test('keeps the insets current for a caller handler under never', async () => {
    const onSafeAreaInsetsChange = jest.fn();
    const renderer = await create(
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        experimental_onSafeAreaInsetsChange={onSafeAreaInsetsChange}
      />,
    );
    const unpadded = renderer.root.findByType('RCTScrollContentView').props
      .style;
    await dispatchSafeAreaInsetsChange(renderer, INSETS);
    expect(onSafeAreaInsetsChange).toHaveBeenCalledTimes(1);
    // Nothing is padded under 'never', so nothing is rendered either.
    expect(renderer.root.findByType('RCTScrollContentView').props.style).toBe(
      unpadded,
    );

    // The insets delivered under 'never' apply as soon as the behavior
    // changes, without another event.
    await act(async () => {
      renderer.update(
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          experimental_onSafeAreaInsetsChange={onSafeAreaInsetsChange}
        />,
      );
    });
    expect(contentContainerStyle(renderer)).toMatchObject({paddingEnd: 84});
  });
});
