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

import type {AccessibilityProps} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {Text, TouchableWithoutFeedback, View} from 'react-native';
import accessibilityPropsSuite from 'react-native/src/private/__tests__/utilities/accessibilityPropsSuite';

describe('<TouchableWithoutFeedback>', () => {
  describe('props', () => {
    describe('empty props', () => {
      it('renders without any props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <Text>Touchable</Text>
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['isPressable']}).toJSX(),
        ).toEqual(<rn-paragraph isPressable="true">Touchable</rn-paragraph>);
      });
    });

    component ComponentWithAccessibilityProps(...props: AccessibilityProps) {
      return (
        <TouchableWithoutFeedback {...props}>
          <Text>Touchable</Text>
        </TouchableWithoutFeedback>
      );
    }

    accessibilityPropsSuite(ComponentWithAccessibilityProps);

    describe('disabled', () => {
      it('sets accessibilityState disabled to true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback disabled={true}>
              <View />
            </TouchableWithoutFeedback>,
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
            <TouchableWithoutFeedback disabled={true} accessibilityState={{}}>
              <View />
            </TouchableWithoutFeedback>,
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
            <TouchableWithoutFeedback
              disabled={true}
              accessibilityState={{checked: true}}>
              <View />
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:Checked,busy:false,expanded:null}" />,
        );
      });

      it('overwrites accessibilityState.disabled with the disabled prop', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback
              disabled={true}
              accessibilityState={{disabled: false}}>
              <View />
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });
    });
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is backed by its child', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <Text>Touchable</Text>
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          nullthrows(root.document.documentElement.firstElementChild).tagName,
        ).toBe('RN:Paragraph');

        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <View>
                <Text>Touchable</Text>
              </View>
            </TouchableWithoutFeedback>,
          );
        });

        expect(
          nullthrows(root.document.documentElement.firstElementChild).tagName,
        ).toBe('RN:View');
      });
    });
  });
});
