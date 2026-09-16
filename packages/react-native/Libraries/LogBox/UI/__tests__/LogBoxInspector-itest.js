/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import LogBoxLog from '../../Data/LogBoxLog';
import LogBoxInspector from '../LogBoxInspector';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

const logs = [
  new LogBoxLog({
    level: 'warn',
    isComponentError: false,
    message: {
      content: 'Some kind of message (first)',
      substitutions: [],
    },
    stack: [],
    category: 'Some kind of message (first)',
    componentStack: [],
  }),
  new LogBoxLog({
    level: 'error',
    isComponentError: false,
    message: {
      content: 'Some kind of message (second)',
      substitutions: [],
    },
    stack: [],
    category: 'Some kind of message (second)',
    componentStack: [],
  }),
  new LogBoxLog({
    level: 'fatal',
    isComponentError: false,
    message: {
      content: 'Some kind of message (third)',
      substitutions: [],
    },
    stack: [],
    category: 'Some kind of message (third)',
    componentStack: [],
  }),
];

describe('LogBoxInspector', () => {
  it('should render null with no logs', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspector
          onDismiss={() => {}}
          onMinimize={() => {}}
          onChangeSelectedIndex={() => {}}
          logs={[]}
          selectedIndex={0}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render warning with selectedIndex 0', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspector
          onDismiss={() => {}}
          onMinimize={() => {}}
          onChangeSelectedIndex={() => {}}
          logs={logs}
          selectedIndex={0}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render fatal with selectedIndex 2', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspector
          onDismiss={() => {}}
          onMinimize={() => {}}
          onChangeSelectedIndex={() => {}}
          logs={logs}
          selectedIndex={2}
          fatalType="fatal"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
