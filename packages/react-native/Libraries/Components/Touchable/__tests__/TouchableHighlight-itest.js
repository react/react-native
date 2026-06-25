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

import type {AccessibilityProps, HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Text, TouchableHighlight, View} from 'react-native';
import accessibilityPropsSuite from 'react-native/src/private/__tests__/utilities/accessibilityPropsSuite';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('<TouchableHighlight>', () => {
  describe('props', () => {
    describe('rendering', () => {
      it('renders as a view with accessible="true"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-view accessible="true" />,
        );
      });
    });

    component ComponentWithAccessibilityProps(...props: AccessibilityProps) {
      return (
        <TouchableHighlight {...props}>
          <Text>Touchable</Text>
        </TouchableHighlight>
      );
    }

    accessibilityPropsSuite(ComponentWithAccessibilityProps);

    describe('style', () => {
      it('applies style props', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight
              style={{
                width: 100,
                height: 50,
                backgroundColor: 'blue',
              }}>
              <View />
            </TouchableHighlight>,
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
          root.render(
            <TouchableHighlight>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view />,
        );
      });

      it('renders with custom style opacity', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight style={{opacity: 0.5}}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view opacity="0.5" />,
        );
      });

      it('applies default activeOpacity (0.85) to child when pressed', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight testOnly_pressed={true}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view>
            <rn-view opacity="0.85" />
          </rn-view>,
        );
      });

      it('applies custom activeOpacity to child when pressed', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight testOnly_pressed={true} activeOpacity={0.5}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
          <rn-view>
            <rn-view opacity="0.5" />
          </rn-view>,
        );
      });
    });

    describe('underlayColor', () => {
      it('renders default underlay color (black) when pressed', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight testOnly_pressed={true}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
        ).toEqual(
          <rn-view backgroundColor="rgba(0, 0, 0, 1)">
            <rn-view />
          </rn-view>,
        );
      });

      it('renders custom underlay color when pressed', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight testOnly_pressed={true} underlayColor="red">
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
        ).toEqual(
          <rn-view backgroundColor="rgba(255, 0, 0, 1)">
            <rn-view />
          </rn-view>,
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
            <TouchableHighlight
              ref={elementRef}
              onPress={onPressCallback}
              style={{height: 100}}>
              <View />
            </TouchableHighlight>,
          );
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPressCallback).toHaveBeenCalledTimes(1);
      });
    });

    describe('onShowUnderlay', () => {
      it('triggers onShowUnderlay callback when pressed', () => {
        const elementRef = createRef<HostInstance>();
        const onShowUnderlayCallback = jest.fn();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight
              ref={elementRef}
              onPress={() => {}}
              onShowUnderlay={onShowUnderlayCallback}
              style={{height: 100}}>
              <View />
            </TouchableHighlight>,
          );
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onShowUnderlayCallback).toHaveBeenCalledTimes(1);
      });
    });

    describe('disabled', () => {
      it('cannot be pressed when disabled', () => {
        const elementRef = createRef<HostInstance>();
        const onPressCallback = jest.fn();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight
              ref={elementRef}
              onPress={onPressCallback}
              disabled={true}>
              <View />
            </TouchableHighlight>,
          );
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });

      it('sets accessibilityState disabled to true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight disabled={true}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });

      it('sets accessibilityState disabled when accessibilityState is empty', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight disabled={true} accessibilityState={{}}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });

      it('preserves accessibilityState values when disabled is true', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight
              disabled={true}
              accessibilityState={{checked: true}}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:Checked,busy:false,expanded:null}" />,
        );
      });

      it('overwrites accessibilityState disabled with disabled prop', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight
              disabled={true}
              accessibilityState={{disabled: false}}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );
      });

      it('disables when only accessibilityState disabled is set', () => {
        const elementRef = createRef<HostInstance>();
        const onPressCallback = jest.fn();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight
              ref={elementRef}
              onPress={onPressCallback}
              accessibilityState={{disabled: true}}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          <rn-view accessibilityState="{disabled:true,selected:false,checked:None,busy:false,expanded:null}" />,
        );

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });
    });

    describe('children', () => {
      it('renders children inside the touchable', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight>
              <Text>Press me</Text>
            </TouchableHighlight>,
          );
        });

        expect(root.getRenderedOutput({props: ['accessible']}).toJSX()).toEqual(
          <rn-view accessible="true">
            <rn-paragraph>Press me</rn-paragraph>
          </rn-view>,
        );
      });

      // Regression test for #54933: a `React.Fragment` cannot accept the
      // underlay style applied via `cloneElement`, so the highlight effect
      // is silently broken. Render the Fragment unchanged and surface an
      // actionable dev warning pointing the user at wrapping in <View>.
      it('logs a dev warning when given a React.Fragment as a child', () => {
        const originalConsoleWarn = console.warn;
        const mockConsoleWarn = jest.fn();
        // $FlowExpectedError[cannot-write]
        console.warn = mockConsoleWarn;

        try {
          const root = Fantom.createRoot();

          Fantom.runTask(() => {
            root.render(
              <TouchableHighlight>
                <React.Fragment>
                  <Text>First</Text>
                  <Text>Second</Text>
                </React.Fragment>
              </TouchableHighlight>,
            );
          });

          expect(
            root.getRenderedOutput({props: ['accessible']}).toJSX(),
          ).toEqual(
            <rn-view accessible="true">
              <rn-paragraph key="0">First</rn-paragraph>
              <rn-paragraph key="1">Second</rn-paragraph>
            </rn-view>,
          );
          expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
          expect(mockConsoleWarn.mock.calls[0][0]).toContain(
            'TouchableHighlight does not support React.Fragment as a child',
          );
        } finally {
          // $FlowExpectedError[cannot-write]
          console.warn = originalConsoleWarn;
        }
      });
    });
  });

  describe('ref', () => {
    describe('instance', () => {
      it('is an element node', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight ref={elementRef}>
              <View />
            </TouchableHighlight>,
          );
        });

        expect(elementRef.current).toBeInstanceOf(ReactNativeElement);
      });

      it('uses the "RN:View" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <TouchableHighlight ref={elementRef}>
              <View />
            </TouchableHighlight>,
          );
        });

        const element = ensureInstance(elementRef.current, ReactNativeElement);
        expect(element.tagName).toBe('RN:View');
      });
    });
  });

  it('has the correct displayName', () => {
    expect(TouchableHighlight.displayName).toBe('TouchableHighlight');
  });
});
