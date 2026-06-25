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

import LogBoxInspectorCodeFrame from '../LogBoxInspectorCodeFrame';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorCodeFrame', () => {
  it('should render null for no code frame', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorCodeFrame componentCodeFrame={null} codeFrame={null} />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render a code frame', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorCodeFrame
          componentCodeFrame={null}
          codeFrame={{
            fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
            location: {row: 199, column: 0},
            content: `  197 | });
    198 |
  > 199 | export default CrashReactApp;
        | ^
    200 |`,
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render both a code frame and a component frame', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorCodeFrame
          componentCodeFrame={{
            content: `  89 |
  90 | function Child() {
> 91 |   return <ConsoleWithThrow />;
     |          ^
  92 | }
  93 |
  94 |`,
            location: {row: 90, column: 10},
            fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
          }}
          codeFrame={{
            fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
            location: {row: 64, column: 16},
            content: `  62 |
  63 | function ConsoleWithThrow() {
> 64 |   console.error('hit');
     |                ^
  65 |   throw new Error('test');
  66 | }
  67 |`,
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should dedupe if code frames are the same', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorCodeFrame
          componentCodeFrame={{
            content: `  63 | function ConsoleWithThrow() {
  64 |   console.error('hit');
> 65 |   throw new Error('test');
     |                  ^
  66 | }
  67 |
  68 |`,
            location: {row: 65, column: 18},
            fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
          }}
          codeFrame={{
            content: `  63 | function ConsoleWithThrow() {
  64 |   console.error('hit');
> 65 |   throw new Error('test');
     |                  ^
  66 | }
  67 |
  68 |`,
            location: {row: 65, column: 18},
            fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render a code frame without a location', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorCodeFrame
          componentCodeFrame={null}
          codeFrame={{
            fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
            location: null,
            content: `  197 | });
    198 |
  > 199 | export default CrashReactApp;
        | ^
    200 |`,
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
