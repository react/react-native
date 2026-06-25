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

import LogBoxInspectorStackFrame from '../LogBoxInspectorStackFrame';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorStackFrame', () => {
  it('should render stack frame', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorStackFrame
          onPress={() => {}}
          frame={{
            column: 1,
            file: 'app.js',
            lineNumber: 1,
            methodName: 'foo',
            collapse: false,
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render stack frame without press feedback', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorStackFrame
          frame={{
            column: 1,
            file: 'app.js',
            lineNumber: 1,
            methodName: 'foo',
            collapse: false,
          }}
        />,
      );
    });

    // Both button backgrounds should be transparent
    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render collapsed stack frame with dimmed text', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorStackFrame
          onPress={() => {}}
          frame={{
            column: 1,
            file: 'app.js',
            lineNumber: 1,
            methodName: 'foo',
            collapse: true,
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
