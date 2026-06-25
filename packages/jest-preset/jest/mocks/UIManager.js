/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const UIManager = {
  AndroidViewPager: {
    Commands: {
      setPage: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
      setPageWithoutAnimation: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
    },
  },
  blur: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  createView: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  customBubblingEventTypes: {},
  customDirectEventTypes: {},
  dispatchViewManagerCommand: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  focus: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  getViewManagerConfig: jest.fn(name => {
    if (name === 'AndroidDrawerLayout') {
      return {
        Constants: {
          DrawerPosition: {
            Left: 10,
          },
        },
      };
    }
  }) as JestMockFn<[string], $FlowFixMe>,
  hasViewManagerConfig: jest.fn(name => {
    return name === 'AndroidDrawerLayout';
  }) as JestMockFn<[string], boolean>,
  measure: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  manageChildren: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  setChildren: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  updateView: jest.fn() as JestMockFn<$FlowFixMe, $FlowFixMe>,
  AndroidDrawerLayout: {
    Constants: {
      DrawerPosition: {
        Left: 10,
      },
    },
  },
  AndroidTextInput: {
    Commands: {},
  },
  ScrollView: {
    Constants: {},
  },
  View: {
    Constants: {},
  },
};

export default UIManager;
