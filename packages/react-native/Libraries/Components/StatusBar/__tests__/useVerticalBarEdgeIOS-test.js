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

jest.mock('../NativeStatusBarManagerIOS', () => ({
  __esModule: true,
  default: {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    getVerticalBarEdge: jest.fn(() => 'trailing'),
  },
}));

const useVerticalBarEdgeIOS = require('../useVerticalBarEdgeIOS').default;
const {create} = require('@react-native/jest-preset/jest/renderer');
const React = require('react');

test('returns the vertical bar edge from the native module', async () => {
  let edge;
  function Probe() {
    edge = useVerticalBarEdgeIOS();
    return null;
  }

  await create(<Probe />);

  expect(edge).toBe('trailing');
});
