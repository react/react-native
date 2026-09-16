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

import LogBoxInspectorHeader from '../LogBoxInspectorHeader';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorHeader', () => {
  it('should render no buttons for one total', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorHeader
          onSelectIndex={() => {}}
          selectedIndex={0}
          total={1}
          level="warn"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render both buttons for two total', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorHeader
          onSelectIndex={() => {}}
          selectedIndex={1}
          total={2}
          level="warn"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render two buttons for three or more total', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorHeader
          onSelectIndex={() => {}}
          selectedIndex={0}
          total={1}
          level="warn"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render syntax error header', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorHeader
          onSelectIndex={() => {}}
          selectedIndex={0}
          total={1}
          level="syntax"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
