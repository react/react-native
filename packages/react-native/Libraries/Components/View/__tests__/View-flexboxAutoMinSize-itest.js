/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @fantom_flags enableFlexboxAutoMinSizeInStrictMode:true
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

type ColumnProps = Readonly<{
  contentPadding: number,
  itemRef: React.RefSetter<HostInstance>,
  minHeight?: number,
}>;

// Two items asking for 200 in a column of 100 shrink to 50 each, unless the
// first one's automatic minimum size, the padding of the view it holds, is
// larger.
function Column({contentPadding, itemRef, minHeight}: ColumnProps): React.Node {
  return (
    <LayoutConformance mode="strict">
      <View style={{height: 100, minHeight}}>
        <View ref={itemRef} style={{flexShrink: 1, height: 200, minHeight}}>
          <View style={{paddingTop: contentPadding}}>
            <View />
          </View>
        </View>
        <View style={{flexShrink: 1, height: 200}} />
      </View>
    </LayoutConformance>
  );
}

describe('the automatic minimum size of a flex item under strict layout conformance', () => {
  it('follows a change to its content', () => {
    const root = Fantom.createRoot();
    const itemRef = createRef<HostInstance>();

    const render = (contentPadding: number) => {
      Fantom.runTask(() => {
        root.render(
          <Column contentPadding={contentPadding} itemRef={itemRef} />,
        );
      });
      return nullthrows(itemRef.current).getBoundingClientRect().height;
    };

    expect(render(30)).toBe(50);
    expect(render(80)).toBe(80);
  });

  it('follows a change to its content laid out under an explicit minimum height', () => {
    const root = Fantom.createRoot();
    const itemRef = createRef<HostInstance>();

    const render = (contentPadding: number, minHeight?: number) => {
      Fantom.runTask(() => {
        root.render(
          <Column
            contentPadding={contentPadding}
            itemRef={itemRef}
            minHeight={minHeight}
          />,
        );
      });
      return nullthrows(itemRef.current).getBoundingClientRect().height;
    };

    expect(render(30)).toBe(50);
    // With explicit minimum heights nothing asks for the content's minimum
    // size, so the change is laid out without it.
    expect(render(80, 0)).toBe(50);
    expect(render(80)).toBe(80);
  });
});
