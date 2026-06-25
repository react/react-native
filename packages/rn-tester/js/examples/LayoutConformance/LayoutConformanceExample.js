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

import type {RNTesterModule} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  View,
  experimental_LayoutConformance as LayoutConformance,
} from 'react-native';

function LayoutConformanceExample({
  testID,
}: Readonly<{testID: ?string}>): React.Node {
  return (
    <View style={{flexDirection: 'row', gap: 10}} testID={testID}>
      <View>
        <RNTesterText>Unset</RNTesterText>
        <LayoutConformanceBox />
      </View>
      <LayoutConformance mode="compatibility">
        <View>
          <RNTesterText>Compat</RNTesterText>
          <LayoutConformanceBox />
        </View>
      </LayoutConformance>
      <LayoutConformance mode="strict">
        <View>
          <RNTesterText>Strict</RNTesterText>
          <LayoutConformanceBox />
        </View>
      </LayoutConformance>
    </View>
  );
}

function LayoutConformanceBox(): React.Node {
  return (
    <View
      style={{
        backgroundColor: 'blue',
        width: 60,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
      {/*Yoga with YGErrataStretchFlexBasis will let this node grow to
          parent width, even though it shouldn't take any space*/}
      <View
        style={{
          flexDirection: 'row',
        }}>
        <View
          style={{
            height: 30,
            backgroundColor: 'red',
            flexGrow: 1,
          }}
        />
      </View>
    </View>
  );
}

export default {
  title: 'LayoutConformance',
  description:
    'Examples laid out in compatibility mode will show a red bar, not present in examples with conformant layout.',
  examples: [
    {
      title: 'LayoutConformance (No outer context)',
      name: 'layout-conformance-no-outer-context',
      render: () => (
        <LayoutConformanceExample testID="layout-conformance-no-outer-context" />
      ),
    },
    {
      title: 'LayoutConformance (Under compatibility context)',
      name: 'layout-conformance-under-compat',
      render: () => (
        <LayoutConformance mode="compatibility">
          <LayoutConformanceExample testID="layout-conformance-under-compat" />
        </LayoutConformance>
      ),
    },
    {
      title: 'LayoutConformance (Under strict context)',
      name: 'layout-conformance-under-strict',
      render: () => (
        <LayoutConformance mode="strict">
          <LayoutConformanceExample testID="layout-conformance-under-strict" />
        </LayoutConformance>
      ),
    },
  ],
} as RNTesterModule;
