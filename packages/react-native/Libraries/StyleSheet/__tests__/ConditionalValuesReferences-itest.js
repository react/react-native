/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags updateRuntimeShadowNodeReferencesOnCommit:* updateRuntimeShadowNodeReferencesOnCommitThread:*
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

// Conditional values are not in the style types yet.
const whiteOrBlack: $FlowFixMe = {
  default: 'white',
  '@media (prefers-color-scheme: dark)': 'black',
};

describe('conditional values and the shadow node references of React', () => {
  afterEach(() => {
    Fantom.setColorScheme('light');
  });

  it('updates a conditional view only in the first React update after a change', () => {
    const root = Fantom.createRoot();
    const renderWithOpacity = (opacity: number) =>
      Fantom.runTask(() => {
        root.render(
          <View collapsable={false}>
            <View nativeID="A" style={{backgroundColor: whiteOrBlack}} />
            <View nativeID="B" style={{opacity}} />
          </View>,
        );
      });
    renderWithOpacity(1);
    root.takeMountingManagerLogs();

    Fantom.setColorScheme('dark');
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "A"}',
    ]);

    // React still holds the view from before the change, so this update
    // resolves it again.
    renderWithOpacity(0.5);
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "A"}',
      'Update {type: "View", nativeID: "B"}',
    ]);

    renderWithOpacity(0.25);
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "B"}',
    ]);
  });
});
