/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import View from 'react-native/Libraries/Components/View/View';
import TestRenderer from 'react-test-renderer';

describe('getBoundingClientRect on mocked host components', () => {
  test('View ref has getBoundingClientRect as a function', async () => {
    let viewRef: $FlowFixMe = null;

    await TestRenderer.act(() => {
      TestRenderer.create(
        <View
          ref={(ref: $FlowFixMe) => {
            viewRef = ref;
          }}
        />,
      );
    });

    expect(viewRef).not.toBeNull();
    expect(typeof viewRef.getBoundingClientRect).toBe('function');
  });

  test('calling getBoundingClientRect on a View ref does not throw', async () => {
    let rect: $FlowFixMe = null;

    await TestRenderer.act(() => {
      TestRenderer.create(
        <View
          ref={(ref: $FlowFixMe) => {
            if (ref) {
              rect = ref.getBoundingClientRect();
            }
          }}
        />,
      );
    });

    expect(rect).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    });
  });
});
