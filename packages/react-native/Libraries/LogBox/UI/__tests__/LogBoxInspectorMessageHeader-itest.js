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

import LogBoxInspectorMessageHeader from '../LogBoxInspectorMessageHeader';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorMessageHeader', () => {
  it('should render error', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorMessageHeader
          title="Error"
          level="error"
          collapsed={false}
          message={{
            content: 'Some error message',
            substitutions: [],
          }}
          onPress={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render fatal', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorMessageHeader
          title="Fatal Error"
          level="fatal"
          collapsed={false}
          message={{
            content: 'Some fatal message',
            substitutions: [],
          }}
          onPress={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render syntax error', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorMessageHeader
          title="Syntax Error"
          level="syntax"
          collapsed={false}
          message={{
            content: 'Some syntax error message',
            substitutions: [],
          }}
          onPress={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should not render See More button for short content', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorMessageHeader
          title="Warning"
          level="warn"
          collapsed={false}
          message={{
            content: 'Short',
            substitutions: [],
          }}
          onPress={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should not render "See More" if expanded', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorMessageHeader
          title="Warning"
          level="warn"
          collapsed={false}
          message={{content: '#'.repeat(301), substitutions: []}}
          onPress={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render "See More" if collapsed', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorMessageHeader
          title="Warning"
          level="warn"
          collapsed={true}
          message={{
            content: '#'.repeat(301),
            substitutions: [],
          }}
          onPress={() => {}}
        />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
