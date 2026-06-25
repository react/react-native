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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Text, TouchableOpacity} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<TouchableOpacity>', () => {
  it('sets displayName', () => {
    expect(TouchableOpacity.displayName).toBe('TouchableOpacity');
  });

  describe('props', () => {
    describe('rendering', () => {
      it('renders as a view with accessible="true"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity />);
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-view accessible="true" />,
        );
      });
    });

    describe('style', () => {
      it('applies style props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableOpacity
              style={{
                width: 100,
                height: 50,
                backgroundColor: 'blue',
              }}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({
              props: ['width', 'height', 'backgroundColor'],
            })
            .toJSX(),
        ).toEqual(
          <rn-view
            backgroundColor="rgba(0, 0, 255, 1)"
            height="50"
            width="100"
          />,
        );
      });
    });

    describe('activeOpacity', () => {
      it('does not render explicit opacity when using default', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity />);
        });

        // Default opacity of 1 is not rendered as a prop
        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view />,
        );
      });

      it('renders with custom style opacity', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity style={{opacity: 0.5}} />);
        });

        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view opacity="0.5" />,
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
            <TouchableOpacity
              ref={elementRef}
              onPress={onPressCallback}
              style={{height: 100}}
            />,
          );
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPressCallback).toHaveBeenCalledTimes(1);
      });
    });

    describe('disabled', () => {
      it('cannot be pressed when disabled', () => {
        const elementRef = createRef<HostInstance>();
        const onPressCallback = jest.fn();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableOpacity
              ref={elementRef}
              onPress={onPressCallback}
              disabled={true}
            />,
          );
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });

      it('sets accessibilityState disabled to true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity disabled={true} />);
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });

      it('sets accessibilityState disabled to true via accessibilityState prop', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableOpacity accessibilityState={{disabled: true}} />,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });
    });

    describe('children', () => {
      it('renders children inside the touchable', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableOpacity>
              <Text>Press me</Text>
            </TouchableOpacity>,
          );
        });

        const element = ensureInstance(
          root.document.documentElement.firstElementChild,
          ReactNativeElement,
        );
        expect(element.childNodes.length).toBe(1);

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-view accessible="true">
            <rn-paragraph>Press me</rn-paragraph>
          </rn-view>,
        );
      });
    });
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is an element node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity ref={elementRef} />);
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
      });

      it('uses the "RN:View" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity ref={elementRef} />);
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:View');
      });
    });
  });
});
