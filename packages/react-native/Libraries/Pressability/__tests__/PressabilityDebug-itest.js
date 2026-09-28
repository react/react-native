/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as PressabilityDebug from '../PressabilityDebug';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useEffect} from 'react';
import {Pressable, Text} from 'react-native';

describe('PressabilityDebug', () => {
  beforeEach(() => {
    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(false);
    });
  });

  afterEach(() => {
    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(false);
    });
  });

  it('shows press targets when enabled, without remounting', () => {
    const root = Fantom.createRoot();
    let mountCount = 0;

    function Screen() {
      useEffect(() => {
        mountCount++;
      }, []);
      return <Pressable style={{height: 10}} />;
    }

    Fantom.runTask(() => {
      root.render(<Screen />);
    });

    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(<rn-view />);

    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(true);
    });

    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(
      <rn-view>
        <rn-view />
      </rn-view>,
    );

    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(false);
    });

    expect(root.getRenderedOutput({props: []}).toJSX()).toEqual(<rn-view />);
    expect(mountCount).toBe(1);
  });

  it('colors pressable text when enabled', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<Text onPress={() => {}}>text</Text>);
    });

    expect(
      root.getRenderedOutput({props: ['foregroundColor']}).toJSX(),
    ).toEqual(
      <rn-paragraph foregroundColor="rgba(0, 0, 0, 0)">text</rn-paragraph>,
    );

    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(true);
    });

    expect(
      root.getRenderedOutput({props: ['foregroundColor']}).toJSX(),
    ).toEqual(
      <rn-paragraph foregroundColor="rgba(255, 0, 255, 1)">text</rn-paragraph>,
    );
  });

  it('colors nested pressable text when enabled', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <Text>
          <Text onPress={() => {}}>nested</Text>
        </Text>,
      );
    });

    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(true);
    });

    expect(
      root.getRenderedOutput({props: ['foregroundColor']}).toJSX(),
    ).toEqual(
      <rn-paragraph foregroundColor="rgba(0, 0, 0, 0)">
        <rn-text foregroundColor="rgba(255, 0, 255, 1)">nested</rn-text>
      </rn-paragraph>,
    );
  });

  it('does not color disabled text', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      PressabilityDebug.setEnabled(true);
    });

    Fantom.runTask(() => {
      root.render(
        <Text disabled onPress={() => {}}>
          text
        </Text>,
      );
    });

    expect(
      root.getRenderedOutput({props: ['foregroundColor']}).toJSX(),
    ).toEqual(
      <rn-paragraph foregroundColor="rgba(0, 0, 0, 0)">text</rn-paragraph>,
    );
  });
});
