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

import LogBoxInspectorFooter from '../LogBoxInspectorFooter';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorFooter', () => {
  it('should render two buttons for warning', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorFooter
          onMinimize={() => {}}
          onDismiss={() => {}}
          onCopy={() => {}}
          level="warn"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render two buttons for error', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorFooter
          onMinimize={() => {}}
          onDismiss={() => {}}
          onCopy={() => {}}
          level="error"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render two buttons for fatal', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorFooter
          onMinimize={() => {}}
          onDismiss={() => {}}
          onCopy={() => {}}
          level="fatal"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render no buttons and a message for syntax error', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorFooter
          onMinimize={() => {}}
          onDismiss={() => {}}
          onCopy={() => {}}
          level="syntax"
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
