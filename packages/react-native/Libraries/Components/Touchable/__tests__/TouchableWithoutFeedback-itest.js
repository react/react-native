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

import accessibilityPropsSuite from '../../../../src/private/__tests__/utilities/accessibilityPropsSuite';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {Text, TouchableWithoutFeedback, View} from 'react-native';

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

    describe('accessibilityState', () => {
      const rawFalseInputs: ReadonlyArray<
        React.ComponentProps<typeof TouchableWithoutFeedback>,
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
            root.render(
              <TouchableWithoutFeedback {...props}>
                <Text>Touchable</Text>
              </TouchableWithoutFeedback>,
            );
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
        props: React.ComponentProps<typeof TouchableWithoutFeedback>,
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
            root.render(
              <TouchableWithoutFeedback {...props}>
                <Text>Touchable</Text>
              </TouchableWithoutFeedback>,
            );
          });
          expect(
            root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
          ).toEqual(
            state == null ? (
              <rn-paragraph>Touchable</rn-paragraph>
            ) : (
              <rn-paragraph accessibilityState={state}>Touchable</rn-paragraph>
            ),
          );
        });
      }

      it('omits the cloned state key and preserves a custom child state without input', () => {
        const root = Fantom.createRoot();
        let capturedProps: React.ComponentProps<typeof Text> | null = null;
        component CaptureChild(...props: React.ComponentProps<typeof Text>) {
          capturedProps = props;
          return <Text {...props}>Touchable</Text>;
        }
        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <CaptureChild />
            </TouchableWithoutFeedback>,
          );
        });
        expect(
          Object.hasOwn(nullthrows(capturedProps), 'accessibilityState'),
        ).toBe(false);

        const childState: NonNullable<
          AccessibilityProps['accessibilityState'],
        > = {checked: 'mixed', selected: false};
        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback>
              <CaptureChild accessibilityState={childState} />
            </TouchableWithoutFeedback>,
          );
        });
        expect(nullthrows(capturedProps).accessibilityState).toBe(childState);
      });

      it('preserves explicit empty and nullish state for a custom child before native parsing', () => {
        const root = Fantom.createRoot();
        let capturedState: AccessibilityProps['accessibilityState'];
        component CaptureChild(...props: AccessibilityProps) {
          capturedState = props.accessibilityState;
          return <Text>Touchable</Text>;
        }
        const states: ReadonlyArray<
          NonNullable<AccessibilityProps['accessibilityState']>,
        > = [
          {},
          {
            busy: undefined,
            checked: null,
            disabled: undefined,
            expanded: null,
            selected: undefined,
          },
        ];
        for (const accessibilityState of states) {
          Fantom.runTask(() => {
            root.render(
              <TouchableWithoutFeedback accessibilityState={accessibilityState}>
                <CaptureChild accessibilityState={{checked: true}} />
              </TouchableWithoutFeedback>,
            );
          });
          expect(capturedState).toEqual({
            busy: undefined,
            checked: accessibilityState.checked,
            disabled: undefined,
            expanded: accessibilityState.expanded,
            selected: undefined,
          });
        }
      });

      it('maps state aliases locally for a custom child and preserves disabled precedence', () => {
        const root = Fantom.createRoot();
        let capturedProps: React.ComponentProps<typeof Text> | null = null;
        component CaptureChild(...props: React.ComponentProps<typeof Text>) {
          capturedProps = props;
          return <Text {...props}>Touchable</Text>;
        }
        Fantom.runTask(() => {
          root.render(
            <TouchableWithoutFeedback
              accessibilityState={{
                busy: true,
                checked: true,
                disabled: true,
                expanded: true,
                selected: true,
              }}
              aria-busy={false}
              aria-checked="mixed"
              aria-disabled={true}
              aria-expanded={false}
              aria-selected={false}
              disabled={false}>
              <CaptureChild accessibilityState={{checked: false}} />
            </TouchableWithoutFeedback>,
          );
        });
        expect(nullthrows(capturedProps).accessibilityState).toEqual({
          busy: false,
          checked: 'mixed',
          disabled: false,
          expanded: false,
          selected: false,
        });
      });
    });

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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:Checked,busy:false,expanded:null}" />,
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
          <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
          nullthrows(
            nullthrows(root.document.documentElement).firstElementChild,
          ).tagName,
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
          nullthrows(
            nullthrows(root.document.documentElement).firstElementChild,
          ).tagName,
        ).toBe('RN:View');
      });
    });
  });
});
