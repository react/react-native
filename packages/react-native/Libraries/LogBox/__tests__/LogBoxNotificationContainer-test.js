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
const {LogBoxNotificationContainer} = require('../LogBoxNotificationContainer');
const render = require('@react-native/jest-preset/jest/renderer');
const React = require('react');

// Mock `LogBoxLogNotification` because we are interested in snapshotting the
// behavior of `LogBoxNotificationContainer`, not `LogBoxLogNotification`.
jest.mock('../UI/LogBoxNotification', () => ({
  __esModule: true,
  default: 'LogBoxLogNotification',
}));

jest.mock('../../Utilities/BackHandler', () =>
  require('../../Utilities/__mocks__/BackHandler'),
);

describe('LogBoxNotificationContainer', () => {
  let output;

  afterEach(async () => {
    if (output) {
      await render.unmount(output);
      output = null;
    }
  });

  it('should render null with no logs', async () => {
    output = await render.create(
      <LogBoxNotificationContainer selectedLogIndex={-1} logs={[]} />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render null with no selected log and disabled', async () => {
    output = await render.create(
      <LogBoxNotificationContainer
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
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render the latest warning notification', async () => {
    output = await render.create(
      <LogBoxNotificationContainer
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
            level: 'warn',
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

  it('should render the latest error notification', async () => {
    output = await render.create(
      <LogBoxNotificationContainer
        selectedLogIndex={-1}
        logs={[
          new LogBoxLog({
            level: 'error',
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

  it('should render both an error and warning notification', async () => {
    output = await render.create(
      <LogBoxNotificationContainer
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

  it('should render selected fatal error even when disabled', async () => {
    output = await render.create(
      <LogBoxNotificationContainer
        isDisabled
        selectedLogIndex={0}
        logs={[
          new LogBoxLog({
            level: 'fatal',
            isComponentError: false,
            message: {
              content: 'Should be selected',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of message',
            componentStack: [],
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should render selected syntax error even when disabled', async () => {
    output = await render.create(
      <LogBoxNotificationContainer
        isDisabled
        selectedLogIndex={0}
        logs={[
          new LogBoxLog({
            level: 'syntax',
            isComponentError: false,
            message: {
              content: 'Should be selected',
              substitutions: [],
            },
            stack: [],
            category: 'Some kind of syntax error message',
            componentStack: [],
            codeFrame: {
              fileName: '/path/to/RKJSModules/Apps/CrashReact/CrashReactApp.js',
              location: {row: 199, column: 0},
              content: `  197 | });
  198 |
> 199 | export default CrashReactApp;
      | ^
  200 |`,
            },
          }),
        ]}
      />,
    );

    expect(output).toMatchSnapshot();
  });

  it('should clear warnings and errors on back press when focused', async () => {
    const clearWarningsSpy = jest.spyOn(LogBoxData, 'clearWarnings');
    const clearErrorsSpy = jest.spyOn(LogBoxData, 'clearErrors');

    output = await render.create(
      <LogBoxNotificationContainer
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

    // Simulate focus on the notification toast
    const notification = output.root.findByProps({level: 'warn'});
    await require('react-test-renderer').act(() => {
      notification.props.onFocusChange(true);
    });

    BackHandler.mockPressBack();

    expect(clearWarningsSpy).toHaveBeenCalled();
    expect(clearErrorsSpy).toHaveBeenCalled();
    expect(BackHandler.exitApp).not.toHaveBeenCalled();

    clearWarningsSpy.mockRestore();
    clearErrorsSpy.mockRestore();
  });

  it('should not intercept back press when not focused', async () => {
    const clearWarningsSpy = jest.spyOn(LogBoxData, 'clearWarnings');
    const clearErrorsSpy = jest.spyOn(LogBoxData, 'clearErrors');

    output = await render.create(
      <LogBoxNotificationContainer
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

    expect(clearWarningsSpy).not.toHaveBeenCalled();
    expect(clearErrorsSpy).not.toHaveBeenCalled();

    clearWarningsSpy.mockRestore();
    clearErrorsSpy.mockRestore();
  });

  it('should not intercept back press when no logs exist', async () => {
    const clearWarningsSpy = jest.spyOn(LogBoxData, 'clearWarnings');
    const clearErrorsSpy = jest.spyOn(LogBoxData, 'clearErrors');

    output = await render.create(
      <LogBoxNotificationContainer selectedLogIndex={-1} logs={[]} />,
    );

    BackHandler.mockPressBack();

    expect(clearWarningsSpy).not.toHaveBeenCalled();
    expect(clearErrorsSpy).not.toHaveBeenCalled();

    clearWarningsSpy.mockRestore();
    clearErrorsSpy.mockRestore();
  });

  it('should remove back handler on unmount', async () => {
    const clearWarningsSpy = jest.spyOn(LogBoxData, 'clearWarnings');
    const clearErrorsSpy = jest.spyOn(LogBoxData, 'clearErrors');

    output = await render.create(
      <LogBoxNotificationContainer
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

    // Focus then unmount
    const notification = output.root.findByProps({level: 'warn'});
    await require('react-test-renderer').act(() => {
      notification.props.onFocusChange(true);
    });

    if (output != null) {
      await render.unmount(output);
      output = null;
    }

    BackHandler.mockPressBack();

    expect(clearWarningsSpy).not.toHaveBeenCalled();
    expect(clearErrorsSpy).not.toHaveBeenCalled();

    clearWarningsSpy.mockRestore();
    clearErrorsSpy.mockRestore();
  });
});
