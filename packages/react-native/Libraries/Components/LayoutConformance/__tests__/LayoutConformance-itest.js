/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags enableFlexboxAutoMinSizeInStrictMode:*
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {
  View,
  experimental_LayoutConformance as LayoutConformance,
} from 'react-native';

type Mode = 'strict' | 'compatibility';

function renderRowWidth(mode: Mode, outerMode?: Mode): number {
  const root = Fantom.createRoot();
  const rowRef = createRef<HostInstance>();

  const content = (
    <LayoutConformance mode={mode}>
      <View
        collapsable={false}
        style={{
          width: 60,
          height: 60,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        {/* With YGErrataStretchFlexBasis this row grows to its parent's
            width, even though its content takes no space. */}
        <View collapsable={false} ref={rowRef} style={{flexDirection: 'row'}}>
          <View collapsable={false} style={{height: 30, flexGrow: 1}} />
        </View>
      </View>
    </LayoutConformance>
  );

  Fantom.runTask(() => {
    root.render(
      outerMode != null ? (
        <LayoutConformance mode={outerMode}>{content}</LayoutConformance>
      ) : (
        content
      ),
    );
  });

  const width = nullthrows(rowRef.current).getBoundingClientRect().width;
  root.destroy();
  return width;
}

test('strict mode lays out its subtree without the stretch flex-basis errata', () => {
  expect(renderRowWidth('strict')).toBe(0);
});

// Compatibility is also the default, so check it under a strict subtree.
test('compatibility mode inside strict mode brings the stretch flex-basis errata back', () => {
  expect(renderRowWidth('compatibility', 'strict')).toBe(60);
});
