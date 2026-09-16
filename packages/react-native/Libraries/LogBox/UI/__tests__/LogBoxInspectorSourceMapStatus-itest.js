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

import LogBoxInspectorSourceMapStatus from '../LogBoxInspectorSourceMapStatus';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorSourceMapStatus', () => {
  it('should render for failed', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorSourceMapStatus onPress={() => {}} status="FAILED" />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render for pending', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorSourceMapStatus onPress={() => {}} status="PENDING" />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render null for complete', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorSourceMapStatus onPress={() => {}} status="COMPLETE" />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
