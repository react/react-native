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
import {Text, TouchableNativeFeedback, View} from 'react-native';

describe('<TouchableNativeFeedback>', () => {
  it('sets displayName', () => {
    expect(TouchableNativeFeedback.displayName).toBe('TouchableNativeFeedback');
  });

  describe('rendering', () => {
    it('renders its child as pressable', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback style={{}}>
            <Text>Touchable</Text>
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['isPressable', 'accessible']}).toJSX(),
      ).toEqual(
        <rn-paragraph accessible="true" isPressable="true">
          Touchable
        </rn-paragraph>,
      );
    });

    it('renders a View child', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(root.getRenderedOutput().toJSX()).toEqual(
        <rn-view
          accessible="true"
          accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}"
        />,
      );
    });
  });

  describe('disabled', () => {
    it('sets accessibilityState disabled to true', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback disabled={true}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });

    it('sets accessibilityState disabled to true when accessibilityState is empty', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback disabled={true} accessibilityState={{}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });

    it('preserves other accessibilityState fields when disabled is true', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={true}
            accessibilityState={{checked: true}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:Checked,busy:false,expanded:null}" />,
      );
    });

    it('overwrites accessibilityState.disabled with the disabled prop (true)', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={true}
            accessibilityState={{disabled: false}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });

    it('overwrites accessibilityState.disabled with the disabled prop (false)', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={false}
            accessibilityState={{disabled: true}}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
      ).toEqual(
        <rn-view accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}" />,
      );
    });
  });
});
