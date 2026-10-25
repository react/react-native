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
        <rn-view accessible="true" />,
      );
    });
  });

  describe('accessibilityState', () => {
    const rawFalseInputs: ReadonlyArray<
      React.ComponentProps<typeof TouchableNativeFeedback>,
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
            <TouchableNativeFeedback {...props}>
              <View />
            </TouchableNativeFeedback>,
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
      props: React.ComponentProps<typeof TouchableNativeFeedback>,
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
            <TouchableNativeFeedback {...props}>
              <View />
            </TouchableNativeFeedback>,
          );
        });
        expect(
          root.getRenderedOutput({props: ['accessibilityState']}).toJSX(),
        ).toEqual(
          state == null ? <rn-view /> : <rn-view accessibilityState={state} />,
        );
      });
    }
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
        <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
        <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
        <rn-view accessibilityState="{disabled:true,selected:null,checked:Checked,busy:false,expanded:null}" />,
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
        <rn-view accessibilityState="{disabled:true,selected:null,checked:None,busy:false,expanded:null}" />,
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
        <rn-view accessibilityState="{disabled:false,selected:null,checked:None,busy:false,expanded:null}" />,
      );
    });
  });
});
