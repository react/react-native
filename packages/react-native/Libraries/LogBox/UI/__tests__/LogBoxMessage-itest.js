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

import LogBoxMessage from '../LogBoxMessage';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxMessage', () => {
  it('should render message', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          message={{
            content: 'Some kind of message',
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render message truncated to 6 chars', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={5}
          message={{
            content: 'Some kind of message',
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render the whole message when maxLength = message length', () => {
    const message = 'Some kind of message';
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={message.length}
          message={{
            content: message,
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render message with substitution', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          message={{
            content: 'normal substitution normal',
            substitutions: [{length: 12, offset: 7}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render message with substitution, truncating the first word 3 letters in', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={3}
          message={{
            content: 'normal substitution normal',
            substitutions: [{length: 12, offset: 7}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render message with substitution, truncating the second word 6 letters in', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={13}
          message={{
            content: 'normal substitution normal',
            substitutions: [{length: 12, offset: 7}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render message with substitution, truncating the third word 2 letters in', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={22}
          message={{
            content: 'normal substitution normal',
            substitutions: [{length: 12, offset: 7}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render the whole message with substitutions when maxLength = message length', () => {
    const message = 'normal substitution normal';
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={message.length}
          message={{
            content: message,
            substitutions: [{length: 12, offset: 7}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render a plaintext message with no substitutions', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          plaintext
          style={{}}
          message={{
            content: 'normal substitution normal',
            substitutions: [{length: 12, offset: 7}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render a plaintext message and clean the content', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          plaintext
          style={{}}
          message={{
            content: 'Error: This should not start with Error:',
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('Should strip "TransformError " without breaking substitution', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          message={{
            content: 'TransformError normal substitution normal',
            substitutions: [{length: 12, offset: 22}],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('Should make links tappable', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          message={{
            content: 'https://reactnative.dev',
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('Should handle multiple links', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          message={{
            content: 'https://reactnative.dev and https://react.dev',
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('Should handle truncated links', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxMessage
          style={{}}
          maxLength={35}
          message={{
            content: 'https://reactnative.dev and https://react.dev',
            substitutions: [],
          }}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
