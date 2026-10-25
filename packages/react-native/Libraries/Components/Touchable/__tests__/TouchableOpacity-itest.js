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
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Text, TouchableOpacity} from 'react-native';

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

        const element = nullthrows(elementRef.current);
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

        const element = nullthrows(elementRef.current);
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
        );
      });
    });

    describe('accessibilityState', () => {
      const rawFalseInputs: ReadonlyArray<
        React.ComponentProps<typeof TouchableOpacity>,
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
            root.render(<TouchableOpacity {...props} />);
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
        props: React.ComponentProps<typeof TouchableOpacity>,
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
            root.render(<TouchableOpacity {...props} />);
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

        const element = nullthrows(
          nullthrows(root.document.documentElement).firstElementChild,
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

        expect(elementRef.current).toBeInstanceOf(HTMLElement);
      });

      it('uses the "RN:View" tag name', () => {
        const elementRef = createRef<HostInstance>();

        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<TouchableOpacity ref={elementRef} />);
        });

        const element = nullthrows(elementRef.current);
        expect(element.tagName).toBe('RN:View');
      });
    });
  });
});
