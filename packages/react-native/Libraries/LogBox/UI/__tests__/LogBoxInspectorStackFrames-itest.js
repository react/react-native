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

import type {StackFrame} from '../../../Core/NativeExceptionsManager';

import LogBoxLog from '../../Data/LogBoxLog';
import LogBoxInspectorStackFrames, {
  getCollapseMessage,
} from '../LogBoxInspectorStackFrames';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

const createLogWithFrames = (collapsedOptions: Array<?boolean>) => {
  return new LogBoxLog({
    level: 'warn',
    isComponentError: false,
    message: {
      content: 'Some kind of message (latest)',
      substitutions: [],
    },
    stack: createCollapsedFrames(collapsedOptions),
    category: 'Some kind of message (latest)',
    componentStack: [],
  });
};

const createCollapsedFrames = (collapsedOptions: Array<?boolean>) => {
  return collapsedOptions.map((option): StackFrame => ({
    column: 1,
    file: 'dependency.js',
    lineNumber: 1,
    methodName: 'foo',
    collapse: option == null ? false : option,
  }));
};

describe('LogBoxInspectorStackFrames', () => {
  it('should render stack frames with 1 frame collapsed', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorStackFrames
          onRetry={() => {}}
          log={createLogWithFrames([false, true])}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render null for empty stack frames', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorStackFrames
          onRetry={() => {}}
          log={createLogWithFrames([])}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  const permutations: Array<[?boolean, ?boolean, ?boolean, boolean, string]> = [
    [null, null, null, true, 'No frames to show'],
    [true, null, null, true, 'See 1 collapsed frame'],
    [true, null, null, false, 'Collapse 1 frame'],
    [false, false, false, true, 'Showing all frames'],
    [true, false, false, true, 'See 1 more frame'],
    [true, true, false, true, 'See 2 more frames'],
    [true, true, true, true, 'See all 3 collapsed frames'],
    [true, true, true, false, 'Collapse all 3 frames'],
    [true, true, false, false, 'Collapse 2 frames'],
    [true, false, false, false, 'Collapse 1 frame'],
    [false, false, false, false, 'Showing all frames'],
  ];

  for (const [
    stackOne,
    stackTwo,
    stackThree,
    collapsed,
    message,
  ] of permutations) {
    it(`For permutation ${String(stackOne)}, ${String(stackTwo)}, ${String(
      stackThree,
    )} and ${String(collapsed)}, should render ${message}`, () => {
      expect(
        getCollapseMessage(
          createCollapsedFrames(
            // $FlowFixMe[incompatible-type]
            [stackOne, stackTwo, stackThree].filter(i => i != null),
          ),
          collapsed,
        ),
      ).toEqual(message);
    });
  }
});
