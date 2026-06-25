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

import Text from '../../../Text/Text';
import LogBoxInspectorSection from '../LogBoxInspectorSection';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxInspectorSection', () => {
  it('should render with only heading', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorSection heading="Test Section">
          <Text>Child</Text>
        </LogBoxInspectorSection>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render with action on the right', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxInspectorSection
          heading="Test Section"
          action={<Text>Right</Text>}>
          <Text>Child</Text>
        </LogBoxInspectorSection>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
