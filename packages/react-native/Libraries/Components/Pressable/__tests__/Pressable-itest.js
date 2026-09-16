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

import type {HostInstance} from 'react-native';
import type {AccessibilityProps} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Pressable} from 'react-native';
import {PlatformColor, Text} from 'react-native';
import accessibilityPropsSuite from 'react-native/src/private/__tests__/utilities/accessibilityPropsSuite';

describe('<Pressable>', () => {
  describe('props', () => {
    describe('style', () => {
      it('can be set with ViewStyle', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Pressable
              style={{
                width: 100,
                height: 50,
                backgroundColor: 'blue',
                borderColor: 'red',
                borderWidth: 3,
                opacity: 40,
              }}
            />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view
            accessible="true"
            accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}"
            backgroundColor="rgba(0, 0, 255, 1)"
            borderWidth="3"
            height="50"
            opacity="40"
            width="100"
          />,
        );
      });

      it('function that receives a boolean reflecting whether the component is currently pressed ', () => {
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(
            <Pressable
              style={({pressed}) => ({
                backgroundColor: pressed ? 'red' : 'gray',
              })}
            />,
          );
        });
        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view
            accessible="true"
            accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}"
            backgroundColor="rgba(128, 128, 128, 1)"
          />,
        );
      });
    });

    describe('onPress', () => {
      it('triggers callback when the element is pressed', () => {
        const elementRef = createRef<HostInstance>();
        const onPressCallback = jest.fn();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Pressable
              ref={elementRef}
              onPress={onPressCallback}
              style={{height: 100}}
            />,
          );
        });

        const element = nullthrows(elementRef.current);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPressCallback).toHaveBeenCalledTimes(1);
      });
    });

    describe('disabled', () => {
      it('cannot be pressed', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();
        const onPressCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <Pressable
              ref={elementRef}
              onPress={onPressCallback}
              disabled={true}
            />,
          );
        });

        const element = nullthrows(elementRef.current);
        Fantom.dispatchNativeEvent(element, 'change', {value: true});

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });

      it('sets accessibilityState disabled to true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Pressable disabled={true} />);
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
          root.render(<Pressable disabled={true} accessibilityState={{}} />);
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
            <Pressable disabled={true} accessibilityState={{checked: true}} />,
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
            <Pressable
              disabled={true}
              accessibilityState={{disabled: false}}
            />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });
    });

    describe('android_ripple', () => {
      it('renders with a numeric color and alpha', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Pressable android_ripple={{color: '#FF0000', alpha: 0.5}} />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view
            accessible="true"
            accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}"
          />,
        );
      });

      it('renders with a PlatformColor and alpha', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Pressable
              android_ripple={{
                color: PlatformColor('?attr/colorAccent'),
                alpha: 0.3,
              }}
            />,
          );
        });

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view
            accessible="true"
            accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}"
          />,
        );
      });

      it('does not crash with an unresolvable PlatformColor', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Pressable
              android_ripple={{
                color: PlatformColor('?attr/doesNotExist'),
                alpha: 0.5,
              }}
            />,
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

    describe('children', () => {
      it('adds children to the component', () => {
        const elementRef = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Pressable ref={elementRef}>
              <Text>the quick brown fox</Text>
            </Pressable>,
          );
        });
        const element = nullthrows(elementRef.current);

        expect(element.childNodes.length).toBe(1);

        expect(root.getRenderedOutput().toJSX()).toEqual(
          <rn-view
            accessible="true"
            accessibilityState="{disabled:false,selected:false,checked:None,busy:false,expanded:null}">
            <rn-paragraph
              allowFontScaling="true"
              ellipsizeMode="tail"
              fontSize="NaN"
              fontSizeMultiplier="NaN"
              foregroundColor="rgba(0, 0, 0, 0)"
              overflow="hidden">
              the quick brown fox
            </rn-paragraph>
          </rn-view>,
        );
      });
    });

    component ComponentWithAccessibilityProps(...props: AccessibilityProps) {
      return <Pressable {...props} />;
    }
    accessibilityPropsSuite(ComponentWithAccessibilityProps);
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is an element node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Pressable ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(HTMLElement);
      });

      it('uses the "RN:View" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Pressable ref={elementRef} />);
        });

        const element = nullthrows(elementRef.current);
        // Pressable is implemented with a <View> under the hood
        expect(element.tagName).toBe('RN:View');
      });
    });
  });
});
