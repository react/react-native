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
  Text,
  View,
  experimental_LayoutConformance as LayoutConformance,
} from 'react-native';

const paragraph = (
  <Text>
    Open <View style={{height: 8, width: 8}} />
  </Text>
);

const paragraphWithMinHeight = (
  <Text style={{minHeight: 0}}>
    Open <View style={{height: 8, width: 8}} />
  </Text>
);

type FooterScreenProps = Readonly<{
  footerHeight: number,
  footerRef: React.RefSetter<HostInstance>,
}>;

function FooterScreen({
  footerHeight,
  footerRef,
}: FooterScreenProps): React.Node {
  return (
    <LayoutConformance mode="strict">
      <View style={{flex: 1}}>
        <View>{paragraph}</View>
        <View ref={footerRef} style={{height: footerHeight}} />
      </View>
    </LayoutConformance>
  );
}

type ItemScreenProps = Readonly<{
  itemMinHeight?: number,
  itemRef: React.RefSetter<HostInstance>,
}>;

function ItemScreen({itemMinHeight, itemRef}: ItemScreenProps): React.Node {
  return (
    <LayoutConformance mode="strict">
      <View style={{flex: 1, minHeight: 0}}>
        <View ref={itemRef} style={{height: 30, minHeight: itemMinHeight}}>
          {paragraphWithMinHeight}
        </View>
      </View>
    </LayoutConformance>
  );
}

describe('<Text> holding a <View> under strict layout conformance', () => {
  it('lays out again after a sibling of the view holding it changes', () => {
    const root = Fantom.createRoot();
    const footerRef = createRef<HostInstance>();

    const render = (footerHeight: number) => {
      Fantom.runTask(() => {
        root.render(
          <FooterScreen footerHeight={footerHeight} footerRef={footerRef} />,
        );
      });
    };

    render(10);
    // Only the footer changes, so the paragraph stays as the first render
    // committed it while its container is laid out again.
    render(20);

    expect(nullthrows(footerRef.current).getBoundingClientRect().height).toBe(
      20,
    );
  });

  it('lays out again after the view holding it drops its minimum height', () => {
    const root = Fantom.createRoot();
    const itemRef = createRef<HostInstance>();

    const render = (itemMinHeight?: number) => {
      Fantom.runTask(() => {
        root.render(
          <ItemScreen itemMinHeight={itemMinHeight} itemRef={itemRef} />,
        );
      });
    };

    // Explicit minimum heights keep the min-content pass out of the paragraph,
    // so the pass first reaches it once the first render has committed it.
    render(0);
    render();

    expect(nullthrows(itemRef.current).getBoundingClientRect().height).toBe(30);
  });
});
