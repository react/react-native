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

const BackHandler: $FlowFixMe = require('../../Utilities/BackHandler').default;
const LogBoxData = require('../Data/LogBoxData');
const LogBoxLog = require('../Data/LogBoxLog').default;
const {
  _LogBoxInspectorContainer: LogBoxInspectorContainer,
} = require('../LogBoxInspectorContainer');
const render = require('@react-native/jest-preset/jest/renderer');
const React = require('react');

// Mock `LogBoxInspector` because we are interested in snapshotting the behavior
// of `LogBoxInspectorContainer`, not `LogBoxInspector`.
jest.mock('../UI/LogBoxInspector', () => ({
  __esModule: true,
  default: 'LogBoxInspector',
}));

jest.mock('../../Utilities/BackHandler', () =>
  require('../../Utilities/__mocks__/BackHandler'),
);

describe('LogBoxInspectorContainer', () => {
  let output;

  afterEach(async () => {
    if (output) {
      await render.unmount(output);
      output = null;
    }
  });

  it('should render inspector with logs, even when disabled', async () => {
    output = await render.create(
      <LogBoxInspectorContainer
        isDisabled
        selectedLogIndex={-1}
        logs={[
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
          }),
          new LogBoxLog({
            level: 'error',
            isComponentError: false,
            message: {
              content: 'Some kind of message (latest)',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message (latest)',
            componentStack: [],
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should minimize inspector on back press when a log is selected', async () => {
    const spy = jest.spyOn(LogBoxData, 'setSelectedLog');

    output = await render.create(
      <LogBoxInspectorContainer
        selectedLogIndex={0}
        logs={[
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
          }),
        ]}
      />,
    );

    BackHandler.mockPressBack();

    expect(spy).toHaveBeenCalledWith(-1);
    expect(BackHandler.exitApp).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should not intercept back press when no log is selected', async () => {
    const spy = jest.spyOn(LogBoxData, 'setSelectedLog');

    output = await render.create(
      <LogBoxInspectorContainer
        selectedLogIndex={-1}
        logs={[
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
          }),
        ]}
      />,
    );

    BackHandler.mockPressBack();

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });

  it('should remove back handler on unmount', async () => {
    const spy = jest.spyOn(LogBoxData, 'setSelectedLog');

    output = await render.create(
      <LogBoxInspectorContainer
        selectedLogIndex={0}
        logs={[
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
          }),
        ]}
      />,
    );

    await render.unmount(output);
    output = null;

    BackHandler.mockPressBack();

    expect(spy).not.toHaveBeenCalled();

    spy.mockRestore();
  });
});
