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
import LogBoxNotification from '../LogBoxNotification';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

const log = new LogBoxLog({
  level: 'warn',
  isComponentError: false,
  message: {
    content: 'Some kind of message',
    substitutions: [],
  },
  stack: [],
  category: 'Some kind of message',
  componentStack: [],
});

describe('LogBoxNotification', () => {
  it('should render log', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxNotification
          log={log}
          totalLogCount={1}
          level="warn"
          onPressOpen={() => {}}
          onPressDismiss={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
