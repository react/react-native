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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {Activity, createRef} from 'react';
import {View} from 'react-native';

describe('<Activity>', () => {
  it('lays out a subtree shown again after it was updated while hidden', () => {
    const root = Fantom.createRoot();
    const childRef = createRef<HostInstance>();
    const grandchildRef = createRef<HostInstance>();
    const siblingRef = createRef<HostInstance>();

    function render(mode: 'visible' | 'hidden', siblingWidth: number) {
      Fantom.runTask(() => {
        root.render(
          <Activity mode={mode}>
            <View style={{width: 100, height: 100}}>
              <View ref={childRef} style={{width: 50, height: 50}}>
                <View ref={grandchildRef} style={{width: 10, height: 10}} />
              </View>
              <View
                ref={siblingRef}
                style={{width: siblingWidth, height: 10}}
              />
            </View>
          </Activity>,
        );
      });
    }

    render('visible', 20);
    render('hidden', 20);
    // Updating the sibling while hidden appends the unchanged child as it was
    // laid out (zeroed out) in the hidden tree.
    render('hidden', 30);
    render('visible', 30);

    const sizeOf = (ref: {current: HostInstance | null}) => {
      const rect = nullthrows(ref.current).getBoundingClientRect();
      return [rect.width, rect.height];
    };
    expect(sizeOf(childRef)).toEqual([50, 50]);
    expect(sizeOf(grandchildRef)).toEqual([10, 10]);
    expect(sizeOf(siblingRef)).toEqual([30, 10]);
  });
});
