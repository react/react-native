/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags updateRuntimeShadowNodeReferencesOnCommit:true enableFabricCommitBranching:*
 * @fantom_react_fb_flags passChildrenWhenCloningPersistedNodes:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';

describe('Render updates with passChildrenWhenCloningPersistedNodes', () => {
  it('updates the runtime shadow node reference correctly when using sync on commit', () => {
    const root = Fantom.createRoot();

    // Initial render setting to row items next to each other
    Fantom.runTask(() => {
      root.render(
        <View nativeID="parent" style={{flex: 1, flexDirection: 'row'}}>
          <View
            nativeID="initial-child-1"
            key="1"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="initial-child-2"
            key="2"
            style={{width: 100, height: 32}}>
            <View nativeID="sub-child-2-1" key="1" />
          </View>
        </View>,
      );
    });

    // Insert new items on the row between the previous two items
    Fantom.runTask(() => {
      root.render(
        <View nativeID="parent" style={{flex: 1, flexDirection: 'row'}}>
          <View
            nativeID="initial-child-1"
            key="1"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="inserted-child-1"
            key="3"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="initial-child-2"
            key="2"
            style={{width: 100, height: 32}}>
            <View nativeID="sub-child-2-1" key="1" />
          </View>
          <View
            nativeID="inserted-child-2"
            key="4"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="inserted-child-3"
            key="5"
            style={{width: 100, height: 32}}
          />
        </View>,
      );
    });

    // Update a prop on the children of the original row item to force a clone
    Fantom.runTask(() => {
      root.render(
        <View nativeID="parent" style={{flex: 1, flexDirection: 'row'}}>
          <View
            nativeID="initial-child-1"
            key="1"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="inserted-child-1"
            key="3"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="initial-child-2"
            key="2"
            style={{width: 100, height: 32}}>
            <View
              nativeID="sub-child-2-1"
              key="1"
              testID="prop-change-to-force-clone"
            />
          </View>
          <View
            nativeID="inserted-child-2"
            key="4"
            style={{width: 100, height: 32}}
          />
          <View
            nativeID="inserted-child-3"
            key="5"
            style={{width: 100, height: 32}}
          />
        </View>,
      );
    });

    // The row items should all be layed out next to each other
    expect(
      root
        .getRenderedOutput({
          includeLayoutMetrics: true,
          props: ['layoutMetrics-frame', 'nativeID'],
        })
        .toJSON(),
    ).toEqual({
      type: 'View',
      props: {
        'layoutMetrics-frame': '{x:0,y:0,width:390,height:844}',
        nativeID: 'parent',
      },
      children: [
        {
          type: 'View',
          props: {
            'layoutMetrics-frame': '{x:0,y:0,width:100,height:32}',
            nativeID: 'initial-child-1',
          },
          children: [],
        },
        {
          type: 'View',
          props: {
            'layoutMetrics-frame': '{x:100,y:0,width:100,height:32}',
            nativeID: 'inserted-child-1',
          },
          children: [],
        },
        {
          type: 'View',
          props: {
            'layoutMetrics-frame': '{x:200,y:0,width:100,height:32}',
            nativeID: 'initial-child-2',
          },
          children: [
            {
              type: 'View',
              props: {
                'layoutMetrics-frame': '{x:0,y:0,width:100,height:0}',
                nativeID: 'sub-child-2-1',
              },
              children: [],
            },
          ],
        },
        {
          type: 'View',
          props: {
            'layoutMetrics-frame': '{x:300,y:0,width:100,height:32}',
            nativeID: 'inserted-child-2',
          },
          children: [],
        },
        {
          type: 'View',
          props: {
            'layoutMetrics-frame': '{x:400,y:0,width:100,height:32}',
            nativeID: 'inserted-child-3',
          },
          children: [],
        },
      ],
    });
  });
});
