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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Text, View} from 'react-native';

type ScreenState = {
  rows: number,
  label: string,
  nestedHidden: boolean,
  absolute: boolean,
};

function Screen({
  hidden,
  state,
}: {
  hidden: boolean,
  state: ScreenState,
}): React.Node {
  const rows = [];
  for (let i = 0; i < state.rows; i++) {
    rows.push(
      <View key={i} style={{flexDirection: 'row', padding: 4}}>
        <View style={{width: 20 + i, height: 20, backgroundColor: 'gray'}} />
        <View style={{display: 'contents'}}>
          <View style={{flex: 1, marginLeft: 4, backgroundColor: 'white'}}>
            <Text>
              {state.label} {i}
            </Text>
          </View>
        </View>
      </View>,
    );
  }
  return (
    <View
      style={{
        display: hidden ? 'none' : 'flex',
        ...(state.absolute
          ? {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0}
          : {flex: 1}),
        backgroundColor: 'yellow',
      }}>
      <View style={{display: state.nestedHidden ? 'none' : 'flex'}}>
        <View style={{height: 30, backgroundColor: 'red'}} />
      </View>
      {rows}
    </View>
  );
}

function App({
  visible,
  headerHeight,
  screens,
}: {
  visible: number,
  headerHeight: number,
  screens: ReadonlyArray<ScreenState>,
}): React.Node {
  return (
    <View style={{flex: 1}}>
      <View style={{height: headerHeight, backgroundColor: 'green'}} />
      <View style={{flex: 1}}>
        {screens.map((state, i) => (
          <Screen key={i} hidden={i !== visible} state={state} />
        ))}
      </View>
    </View>
  );
}

function renderedOutput(root: Fantom.Root) {
  return root
    .getRenderedOutput({includeLayoutMetrics: true, includeRoot: false})
    .toJSON();
}

const INITIAL: ReadonlyArray<ScreenState> = [
  {rows: 3, label: 'A', nestedHidden: false, absolute: true},
  {rows: 3, label: 'B', nestedHidden: false, absolute: true},
  {rows: 3, label: 'C', nestedHidden: true, absolute: false},
];

describe('display: none subtrees', () => {
  it('lays out a screen shown again after updates while it was hidden', () => {
    const root = Fantom.createRoot({viewportWidth: 400, viewportHeight: 800});
    let screens = INITIAL;
    let headerHeight = 50;
    const render = (visible: number) => {
      Fantom.runTask(() => {
        root.render(
          <App
            visible={visible}
            headerHeight={headerHeight}
            screens={screens}
          />,
        );
      });
    };

    // Lay out every screen once, then hide all but the first.
    render(1);
    render(2);
    render(0);

    // Updates to the visible screen, the layout around the hidden screens,
    // and the hidden screens themselves.
    for (let i = 0; i < 5; i++) {
      headerHeight = 50 + (i % 2) * 10;
      render(0);
    }
    screens = [
      INITIAL[0],
      {rows: 5, label: 'B2', nestedHidden: true, absolute: true},
      {rows: 1, label: 'C2', nestedHidden: false, absolute: false},
    ];
    render(0);
    headerHeight = 70;
    render(0);

    render(1);
    const shownB = renderedOutput(root);
    render(2);
    const shownC = renderedOutput(root);

    // The same final states, rendered without ever hiding the screens.
    const reference = Fantom.createRoot({
      viewportWidth: 400,
      viewportHeight: 800,
    });
    Fantom.runTask(() => {
      reference.render(
        <App visible={1} headerHeight={headerHeight} screens={screens} />,
      );
    });
    expect(shownB).toEqual(renderedOutput(reference));
    Fantom.runTask(() => {
      reference.render(
        <App visible={2} headerHeight={headerHeight} screens={screens} />,
      );
    });
    expect(shownC).toEqual(renderedOutput(reference));

    root.destroy();
    reference.destroy();
  });

  it('does not clone a hidden subtree when its parent is laid out again', () => {
    const root = Fantom.createRoot({viewportWidth: 400, viewportHeight: 800});
    const headerRef = React.createRef<React.ElementRef<typeof View>>();
    const hiddenLeafRef = React.createRef<React.ElementRef<typeof View>>();
    const render = (headerHeight: number, hiddenRows: number) => {
      Fantom.runTask(() => {
        root.render(
          <View style={{flex: 1}}>
            <View ref={headerRef} style={{height: headerHeight}} />
            <View style={{display: 'none'}}>
              <View>
                <View ref={hiddenLeafRef} style={{height: 10}} />
              </View>
              {Array.from({length: hiddenRows}, (_, i) => (
                <View key={i} style={{height: 10}} />
              ))}
            </View>
          </View>,
        );
      });
    };

    render(50, 0);
    const getLeafRevision =
      Fantom.createShadowNodeRevisionGetter(hiddenLeafRef);
    let revision = getLeafRevision();

    // React commits that lay out the hidden node's parent again.
    render(60, 0);
    render(50, 0);
    expect(getLeafRevision()).toBe(revision);

    // Adding a node under the hidden node may clone the subtree once. Later
    // commits don't clone it again.
    render(50, 1);
    revision = getLeafRevision();
    render(60, 1);
    render(50, 1);
    expect(getLeafRevision()).toBe(revision);

    // A commit that doesn't go through React.
    Fantom.runTask(() => {
      headerRef.current?.setNativeProps({style: {height: 70}});
    });
    expect(getLeafRevision()).toBe(revision);

    root.destroy();
  });
});
