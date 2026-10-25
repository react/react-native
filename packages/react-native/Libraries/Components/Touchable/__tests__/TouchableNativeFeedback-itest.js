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

import type {AccessibilityProps, HostInstance, ViewProps} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Text, TouchableNativeFeedback, View} from 'react-native';

describe('<TouchableNativeFeedback>', () => {
  it('sets displayName', () => {
    expect(TouchableNativeFeedback.displayName).toBe('TouchableNativeFeedback');
  });

  describe('rendering', () => {
    it('preserves child styling when the wrapper receives a style', () => {
      const root = Fantom.createRoot();
      for (const style of [null, {width: 100}]) {
        Fantom.runTask(() => {
          root.render(
            <TouchableNativeFeedback style={style}>
              <View style={{width: 10}} />
            </TouchableNativeFeedback>,
          );
        });
        expect(root.getRenderedOutput({props: ['width']}).toJSX()).toEqual(
          <rn-view width="10" />,
        );
      }
    });

    it('normalizes aliases for custom children without synthesizing empty state', () => {
      const root = Fantom.createRoot();
      let received: ?ViewProps;
      component Child(...props: ViewProps) {
        received = props;
        return <View {...props} />;
      }

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            disabled={false}
            aria-disabled={true}
            aria-busy={false}
            aria-checked="mixed"
            aria-expanded={false}
            aria-selected={false}
            aria-label=""
            id=""
            aria-hidden={true}>
            <Child accessibilityLabel="child" nativeID="child" />
          </TouchableNativeFeedback>,
        );
      });
      const props = nullthrows(received);
      expect(props.accessibilityState).toEqual({
        busy: false,
        checked: 'mixed',
        disabled: false,
        expanded: false,
        selected: false,
      });
      expect(props.accessibilityLabel).toBe('');
      expect(props.nativeID).toBe('');
      expect(props.accessibilityElementsHidden).toBe(true);
      expect(props.importantForAccessibility).toBe('no-hide-descendants');

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback aria-hidden={false}>
            <Child importantForAccessibility="yes" />
          </TouchableNativeFeedback>,
        );
      });
      expect(nullthrows(received).accessibilityElementsHidden).toBe(false);
      expect(nullthrows(received).importantForAccessibility).toBe('yes');
      expect(Object.keys(nullthrows(received))).not.toContain(
        'accessibilityState',
      );
    });

    it('preserves child props without adding absent view or touch-only props', () => {
      const root = Fantom.createRoot();
      let childProps: ?ViewProps;

      component Child(...props: ViewProps) {
        childProps = props;
        return <View {...props} />;
      }

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback delayLongPress={100} onPress={() => {}}>
            <Child
              accessibilityLabel="Child label"
              accessibilityState={{checked: true}}
              accessibilityValue={{text: 'Child value'}}
              nativeID="child-id"
              testID="child-test"
            />
          </TouchableNativeFeedback>,
        );
      });

      const receivedProps = nullthrows(childProps);
      expect(receivedProps.accessibilityLabel).toBe('Child label');
      expect(receivedProps.accessibilityState).toEqual({checked: true});
      expect(receivedProps.accessibilityValue).toEqual({text: 'Child value'});
      expect(receivedProps.nativeID).toBe('child-id');
      expect(receivedProps.testID).toBe('child-test');
      for (const prop of [
        'accessibilityHint',
        'accessibilityLiveRegion',
        'accessibilityViewIsModal',
        'delayLongPress',
        'onPress',
      ]) {
        expect(Object.keys(receivedProps)).not.toContain(prop);
      }

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            aria-live="off"
            aria-modal={true}
            aria-valuenow={0}
            accessibilityValue={{max: 10, now: 7}}>
            <Child />
          </TouchableNativeFeedback>,
        );
      });

      expect(nullthrows(childProps).accessibilityLiveRegion).toBe('none');
      expect(nullthrows(childProps).accessibilityViewIsModal).toBe(true);
      expect(nullthrows(childProps).accessibilityValue).toEqual({
        max: 10,
        min: undefined,
        now: 0,
        text: undefined,
      });
    });

    it('lets View resolve accessibility aliases and their precedence', () => {
      const root = Fantom.createRoot();

      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback
            aria-label="ARIA label"
            accessibilityLabel="Legacy label"
            aria-busy={false}
            aria-checked={false}
            aria-expanded={false}
            aria-selected={false}
            accessibilityState={{
              busy: true,
              checked: true,
              expanded: true,
              selected: true,
            }}>
            <View />
          </TouchableNativeFeedback>,
        );
      });

      expect(
        root
          .getRenderedOutput({
            props: ['accessibilityLabel', 'accessibilityState'],
          })
          .toJSONObject().props,
      ).toEqual({
        accessibilityLabel: 'ARIA label',
        accessibilityState:
          '{disabled:false,selected:false,checked:Unchecked,busy:false,expanded:false}',
      });
    });

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

  it('uses inherited disabled state for presses and lets disabled override it', () => {
    const root = Fantom.createRoot();
    const elementRef = createRef<HostInstance>();
    const onPress = jest.fn();

    const disabledProps: ReadonlyArray<AccessibilityProps> = [
      {'aria-disabled': true},
      {accessibilityState: {disabled: true}},
    ];
    for (const props of disabledProps) {
      Fantom.runTask(() => {
        root.render(
          <TouchableNativeFeedback {...props} onPress={onPress}>
            <View ref={elementRef} />
          </TouchableNativeFeedback>,
        );
      });
      Fantom.dispatchNativeEvent(nullthrows(elementRef.current), 'click');
      expect(onPress).not.toHaveBeenCalled();
    }

    Fantom.runTask(() => {
      root.render(
        <TouchableNativeFeedback
          onPress={onPress}
          disabled={false}
          aria-disabled={true}>
          <View ref={elementRef} />
        </TouchableNativeFeedback>,
      );
    });
    Fantom.dispatchNativeEvent(nullthrows(elementRef.current), 'click');
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(
      root.getRenderedOutput({props: ['accessibilityState']}).toJSONObject()
        .props.accessibilityState,
    ).toBe(
      '{disabled:false,selected:null,checked:None,busy:false,expanded:null}',
    );
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
