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
import LogBoxInspectorReactFrames from '../LogBoxInspectorReactFrames';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorReactFrames', () => {
  it('should render null for no componentStack frames', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorReactFrames
          log={
            new LogBoxLog({
              level: 'warn',
              isComponentError: false,
              message: {
                content: 'Some kind of message',
                substitutions: [],
              },
              stack: [],
              category: 'Some kind of message',
              componentStack: [],
            })
          }
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render componentStack frames without full path pressable', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorReactFrames
          log={
            new LogBoxLog({
              level: 'warn',
              isComponentError: false,
              message: {
                content: 'Some kind of message',
                substitutions: [],
              },
              stack: [],
              category: 'Some kind of message',
              componentStack: [
                {
                  methodName: 'MyComponent',
                  file: 'MyComponentFile.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
              ],
            })
          }
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render componentStack frames with full path pressable', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorReactFrames
          log={
            new LogBoxLog({
              level: 'warn',
              isComponentError: false,
              message: {
                content: 'Some kind of message',
                substitutions: [],
              },
              stack: [],
              category: 'Some kind of message',
              componentStack: [
                {
                  methodName: 'MyComponent',
                  file: '/path/to/MyComponentFile.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
              ],
            })
          }
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render componentStack frames with parent folder of index.js', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorReactFrames
          log={
            new LogBoxLog({
              level: 'warn',
              isComponentError: false,
              message: {
                content: 'Some kind of message',
                substitutions: [],
              },
              stack: [],
              category: 'Some kind of message',
              componentStack: [
                {
                  methodName: 'MyComponent',
                  file: '/path/to/index.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
              ],
            })
          }
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render componentStack frames with more than 3 stacks', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorReactFrames
          log={
            new LogBoxLog({
              level: 'warn',
              isComponentError: false,
              message: {
                content: 'Some kind of message',
                substitutions: [],
              },
              stack: [],
              category: 'Some kind of message',
              componentStack: [
                {
                  methodName: 'MyComponent',
                  file: '/path/to/index.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
                {
                  methodName: 'MyComponent2',
                  file: '/path/to/index2.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
                {
                  methodName: 'MyComponent3',
                  file: '/path/to/index3.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
                {
                  methodName: 'MyComponent4',
                  file: '/path/to/index4.js',
                  lineNumber: 1,
                  column: -1,
                  collapse: false,
                },
              ],
            })
          }
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
