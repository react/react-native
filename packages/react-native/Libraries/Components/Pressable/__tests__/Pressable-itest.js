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

import accessibilityPropsSuite from '../../../../src/private/__tests__/utilities/accessibilityPropsSuite';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Pressable} from 'react-native';
import {PlatformColor, Text} from 'react-native';

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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:Checked,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
        );
      });
    });

    describe('accessibilityState', () => {
      const rawFalseInputs: ReadonlyArray<
        React.ComponentProps<typeof Pressable>,
      > = [
        {'aria-busy': false},
        {'aria-checked': false},
        {'aria-disabled': false},
        {'aria-expanded': false},
        {'aria-selected': false},
        {disabled: false},
      ];
      for (const props of rawFalseInputs) {
        it(`creates state for ${Object.keys(props)[0]}=false without an accessibilityState input`, () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<Pressable {...props} />);
          });
          expect(
            Object.hasOwn(
              root
                .getRenderedOutput({props: ['accessibilityState']})
                .toJSONObject().props,
              'accessibilityState',
            ),
          ).toBe(true);
        });
      }
      const cases: ReadonlyArray<{
        name: string,
        props: React.ComponentProps<typeof Pressable>,
        state: ?string,
      }> = [
        {name: 'no input', props: {}, state: null},
        {
          name: 'nullish raw inputs',
          props: {
            accessibilityState: null,
            'aria-busy': null,
            'aria-checked': null,
            'aria-disabled': null,
            'aria-expanded': null,
            'aria-selected': null,
            disabled: null,
          },
          state: null,
        },
        {
          name: 'explicit empty state',
          props: {accessibilityState: {}},
          state:
            '{disabled:false,selected:null,checked:None,busy:false,expanded:null}',
        },
        {
          name: 'explicit all-nullish state',
          props: {
            accessibilityState: {
              busy: undefined,
              checked: undefined,
              disabled: undefined,
              expanded: undefined,
              selected: undefined,
            },
          },
          state:
            '{disabled:false,selected:null,checked:None,busy:false,expanded:null}',
        },
        {
          name: 'false aliases overriding state',
          props: {
            accessibilityState: {
              busy: true,
              checked: true,
              disabled: true,
              expanded: true,
              selected: true,
            },
            'aria-busy': false,
            'aria-checked': false,
            'aria-disabled': false,
            'aria-expanded': false,
            'aria-selected': false,
          },
          state:
            '{disabled:false,selected:false,checked:Unchecked,busy:false,expanded:false}',
        },
        {
          name: 'mixed alias overriding state',
          props: {accessibilityState: {checked: true}, 'aria-checked': 'mixed'},
          state:
            '{disabled:false,selected:null,checked:Mixed,busy:false,expanded:null}',
        },
        {
          name: 'disabled false overriding alias and state',
          props: {
            disabled: false,
            'aria-disabled': true,
            accessibilityState: {disabled: true},
          },
          state:
            '{disabled:false,selected:null,checked:None,busy:false,expanded:null}',
        },
        {
          name: 'disabled true overriding alias and state',
          props: {
            disabled: true,
            'aria-disabled': false,
            accessibilityState: {disabled: false},
          },
          state:
            '{disabled:true,selected:null,checked:None,busy:false,expanded:null}',
        },
      ];
      for (const {name, props, state} of cases) {
        it(`preserves presence and values for ${name}`, () => {
          const root = Fantom.createRoot();
          Fantom.runTask(() => {
            root.render(<Pressable {...props} />);
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            state == null ? (
              <rn-view />
            ) : (
              <rn-view accessibilityState={state} />
            ),
          );
        });
      }
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
          <rn-view accessible="true" />,
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
          <rn-view accessible="true" />,
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
          <rn-view accessible="true" />,
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
          <rn-view accessible="true">
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
