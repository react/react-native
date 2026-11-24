/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ReactTestRenderer} from 'react-test-renderer';

import RNTesterText from '../../../components/RNTesterText';
import nullthrows from 'nullthrows';
import * as React from 'react';
import TestRenderer from 'react-test-renderer';

const {
  render: Example,
} = require('../IntersectionObserverScrollMarginPrefetch');

it.each([
  [[false, true], '#1', 1],
  [[true, false], 'none', 0],
  [[true, true], '#1', 1],
])(
  'uses the last entry per item for batch %j',
  async (transitions, items, messageCount) => {
    const originalObserver = Object.getOwnPropertyDescriptor(
      global,
      'IntersectionObserver',
    );
    const mockObserver = {observe: jest.fn(), disconnect: jest.fn()};
    const mockConstructor = jest.fn();
    mockConstructor.mockReturnValue(mockObserver);
    Object.defineProperty(global, 'IntersectionObserver', {
      value: mockConstructor,
      configurable: true,
      writable: true,
    });

    let renderer: ?ReactTestRenderer;
    try {
      await TestRenderer.act(() => {
        renderer = TestRenderer.create(<Example />, {
          createNodeMock: () => ({}),
        });
      });
      const mountedRenderer = nullthrows(renderer);
      expect(mockConstructor).toHaveBeenCalledTimes(1);
      const callback = mockConstructor.mock.calls[0][0];
      const target = mockObserver.observe.mock.calls[0][0];

      await TestRenderer.act(() => {
        callback(
          transitions.map(isIntersecting => ({target, isIntersecting})),
          mockObserver,
        );
      });

      const texts = mountedRenderer.root
        .findAllByType(RNTesterText)
        .map(text => text.props.children);
      expect(texts).toContain(`Within 500px of the viewport: ${items}`);
      expect(
        texts.filter(text => text === '#1 is within 500px: prefetch it'),
      ).toHaveLength(messageCount);
    } finally {
      if (renderer != null) {
        const mountedRenderer = renderer;
        await TestRenderer.act(() => mountedRenderer.unmount());
      }
      if (originalObserver != null) {
        Object.defineProperty(global, 'IntersectionObserver', originalObserver);
      } else {
        Reflect.deleteProperty(global, 'IntersectionObserver');
      }
    }
  },
);
