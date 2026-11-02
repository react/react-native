/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import App from '../App';
import React from 'react';
import {I18nManager, View} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test('pads the physical edges with the safe area insets in RTL', async () => {
  jest.replaceProperty(I18nManager, 'isRTL', true);

  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  const getRootView = () => renderer!.root.findAllByType(View)[0];

  await ReactTestRenderer.act(() => {
    getRootView().props.experimental_onSafeAreaInsetsChange({
      nativeEvent: {insets: {top: 44, right: 0, bottom: 34, left: 59}},
    });
  });

  expect(getRootView().props.style).toEqual({
    paddingTop: 44,
    paddingRight: 59,
    paddingBottom: 34,
    paddingLeft: 0,
  });
});
