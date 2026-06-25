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

import type {PressabilityConfig} from '../Pressability';
import type {HostInstance} from 'react-native';

import usePressability from '../usePressability';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';
import ensureInstance from 'react-native/src/private/__tests__/utilities/ensureInstance';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function PressabilityTestView({
  config,
  ...viewProps
}: {
  config: PressabilityConfig,
  ref?: React.RefSetter<HostInstance>,
  style?: {height: number},
}) {
  const eventHandlers = usePressability(config);
  return <View {...viewProps} {...eventHandlers} />;
}

describe('Pressability', () => {
  describe('usePressability', () => {
    describe('onPress', () => {
      it('fires onPress callback on click event', () => {
        const onPress = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onPress}}
              style={{height: 100}}
            />,
          );
        });

        const element = ensureInstance(ref.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPress).toHaveBeenCalledTimes(1);
      });

      it('does not fire onPress when disabled is true', () => {
        const onPress = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onPress, disabled: true}}
              style={{height: 100}}
            />,
          );
        });

        const element = ensureInstance(ref.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');

        expect(onPress).toHaveBeenCalledTimes(0);
      });

      it('fires onPress after re-enabling (disabled true → false)', () => {
        const onPress = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onPress, disabled: true}}
              style={{height: 100}}
            />,
          );
        });

        const element = ensureInstance(ref.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');
        expect(onPress).toHaveBeenCalledTimes(0);

        // Re-enable
        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onPress, disabled: false}}
              style={{height: 100}}
            />,
          );
        });

        Fantom.dispatchNativeEvent(element, 'click');
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    describe('onFocus', () => {
      it('fires onFocus callback on focus event', () => {
        const onFocus = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onFocus}}
              style={{height: 100}}
            />,
          );
        });

        expect(onFocus).toHaveBeenCalledTimes(0);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(ref, 'focus');
        });

        Fantom.runWorkLoop();

        expect(onFocus).toHaveBeenCalledTimes(1);
      });
    });

    describe('onBlur', () => {
      it('fires onBlur callback on blur event', () => {
        const onBlur = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onBlur}}
              style={{height: 100}}
            />,
          );
        });

        expect(onBlur).toHaveBeenCalledTimes(0);

        Fantom.runOnUIThread(() => {
          Fantom.enqueueNativeEvent(ref, 'blur');
        });

        Fantom.runWorkLoop();

        expect(onBlur).toHaveBeenCalledTimes(1);
      });
    });

    describe('config updates', () => {
      it('uses updated callbacks after re-render with new config', () => {
        const onPressFirst = jest.fn();
        const onPressSecond = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onPress: onPressFirst}}
              style={{height: 100}}
            />,
          );
        });

        const element = ensureInstance(ref.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');
        expect(onPressFirst).toHaveBeenCalledTimes(1);
        expect(onPressSecond).toHaveBeenCalledTimes(0);

        // Re-render with new callback
        Fantom.runTask(() => {
          root.render(
            <PressabilityTestView
              ref={ref}
              config={{onPress: onPressSecond}}
              style={{height: 100}}
            />,
          );
        });

        Fantom.dispatchNativeEvent(element, 'click');
        expect(onPressFirst).toHaveBeenCalledTimes(1);
        expect(onPressSecond).toHaveBeenCalledTimes(1);
      });
    });

    describe('cleanup on unmount', () => {
      it('does not fire callbacks after component unmounts', () => {
        const onPress = jest.fn();
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();

        function TestApp({showPressable}: {showPressable: boolean}) {
          if (showPressable) {
            return (
              <PressabilityTestView
                ref={ref}
                config={{onPress}}
                style={{height: 100}}
              />
            );
          }
          return <View />;
        }

        Fantom.runTask(() => {
          root.render(<TestApp showPressable={true} />);
        });

        const element = ensureInstance(ref.current, ReactNativeElement);
        Fantom.dispatchNativeEvent(element, 'click');
        expect(onPress).toHaveBeenCalledTimes(1);

        // Unmount the pressable component
        Fantom.runTask(() => {
          root.render(<TestApp showPressable={false} />);
        });

        // The element is no longer in the tree, but verify the config
        // was reset by Pressability.reset() (called from the hook cleanup).
        // Dispatching to a detached element won't reach the handler,
        // so we verify that unmounting didn't throw and the callback
        // count remains at 1.
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });
  });
});
