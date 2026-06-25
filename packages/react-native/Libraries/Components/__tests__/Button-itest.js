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
import nullthrows from 'nullthrows';
import * as React from 'react';
import {Button} from 'react-native';

describe('<Button>', () => {
  describe('props', () => {
    describe('title', () => {
      it('sets the text of the button', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Button title="Hello" />);
        });

        expect(
          root
            .getRenderedOutput({props: ['foregroundColor', 'backgroundColor']})
            .toJSX(),
        ).toEqual(
          // Upper case on Android (also used by Fantom)
          <rn-view backgroundColor="rgba(33, 150, 243, 1)">
            <rn-paragraph foregroundColor="rgba(255, 255, 255, 1)">
              HELLO
            </rn-paragraph>
          </rn-view>,
        );
      });
    });

    describe('color', () => {
      it('sets the background color of the button (non-iOS)', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Button title="Hello" color="blue" />);
        });

        expect(
          root
            .getRenderedOutput({props: ['foregroundColor', 'backgroundColor']})
            .toJSX(),
        ).toEqual(
          <rn-view backgroundColor="rgba(0, 0, 255, 1)">
            <rn-paragraph foregroundColor="rgba(255, 255, 255, 1)">
              HELLO
            </rn-paragraph>
          </rn-view>,
        );
      });
    });

    describe('onPress', () => {
      it('is called when the button is pressed', () => {
        const root = Fantom.createRoot();

        const onPressCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(<Button title="Hello" onPress={onPressCallback} />);
        });

        expect(onPressCallback).toHaveBeenCalledTimes(0);

        // This is necessary because `<Button>` doesn't provide a `<View>` ref
        // but an instance of `Touchable` that isn't a ReactNativeElement.
        const buttonViewNode = nullthrows(
          root.document.documentElement.firstElementChild,
        );

        Fantom.dispatchNativeEvent(buttonViewNode, 'click', {});

        expect(onPressCallback).toHaveBeenCalledTimes(1);
      });
    });

    describe('disabled', () => {
      it('sets different default colors', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Button title="Hello" disabled={true} />);
        });

        expect(
          root
            .getRenderedOutput({props: ['foregroundColor', 'backgroundColor']})
            .toJSX(),
        ).toEqual(
          <rn-view backgroundColor="rgba(223, 223, 223, 1)">
            <rn-paragraph foregroundColor="rgba(161, 161, 161, 1)">
              HELLO
            </rn-paragraph>
          </rn-view>,
        );
      });

      it('prevents the button onPress callback from being called', () => {
        const root = Fantom.createRoot();

        const onPressCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <Button title="Hello" disabled={true} onPress={onPressCallback} />,
          );
        });

        expect(onPressCallback).toHaveBeenCalledTimes(0);

        // This is necessary because `<Button>` doesn't provide a `<View>` ref
        // but an instance of `Touchable` that isn't a ReactNativeElement.
        const buttonViewNode = nullthrows(
          root.document.documentElement.firstElementChild,
        );

        Fantom.dispatchNativeEvent(buttonViewNode, 'click', {});

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });

      it('takes precendence over accessibilityState (set to true)', () => {
        const root = Fantom.createRoot();

        const onPressCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <Button
              title="Hello"
              disabled={true}
              accessibilityState={{disabled: false}}
              onPress={onPressCallback}
            />,
          );
        });

        expect(onPressCallback).toHaveBeenCalledTimes(0);

        // This is necessary because `<Button>` doesn't provide a `<View>` ref
        // but an instance of `Touchable` that isn't a ReactNativeElement.
        const buttonViewNode = nullthrows(
          root.document.documentElement.firstElementChild,
        );

        Fantom.dispatchNativeEvent(buttonViewNode, 'click', {});

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });

      it('takes precendence over accessibilityState (set to false)', () => {
        const root = Fantom.createRoot();

        const onPressCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <Button
              title="Hello"
              disabled={false}
              accessibilityState={{disabled: true}}
              onPress={onPressCallback}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({props: ['foregroundColor', 'backgroundColor']})
            .toJSX(),
        ).toEqual(
          <rn-view backgroundColor="rgba(33, 150, 243, 1)">
            <rn-paragraph foregroundColor="rgba(255, 255, 255, 1)">
              HELLO
            </rn-paragraph>
          </rn-view>,
        );

        expect(onPressCallback).toHaveBeenCalledTimes(0);

        // This is necessary because `<Button>` doesn't provide a `<View>` ref
        // but an instance of `Touchable` that isn't a ReactNativeElement.
        const buttonViewNode = nullthrows(
          root.document.documentElement.firstElementChild,
        );

        Fantom.dispatchNativeEvent(buttonViewNode, 'click', {});

        expect(onPressCallback).toHaveBeenCalledTimes(1);
      });
    });

    describe('accessibilityState', () => {
      it('disables the button when disabled property is true and disabled prop is NOT set', () => {
        const root = Fantom.createRoot();

        const onPressCallback = jest.fn();

        Fantom.runTask(() => {
          root.render(
            <Button
              title="Hello"
              accessibilityState={{disabled: true}}
              onPress={onPressCallback}
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({props: ['foregroundColor', 'backgroundColor']})
            .toJSX(),
        ).toEqual(
          <rn-view backgroundColor="rgba(223, 223, 223, 1)">
            <rn-paragraph foregroundColor="rgba(161, 161, 161, 1)">
              HELLO
            </rn-paragraph>
          </rn-view>,
        );

        expect(onPressCallback).toHaveBeenCalledTimes(0);

        // This is necessary because `<Button>` doesn't provide a `<View>` ref
        // but an instance of `Touchable` that isn't a ReactNativeElement.
        const buttonViewNode = nullthrows(
          root.document.documentElement.firstElementChild,
        );

        Fantom.dispatchNativeEvent(buttonViewNode, 'click', {});

        expect(onPressCallback).toHaveBeenCalledTimes(0);
      });
    });

    describe('importantForAccessibility', () => {
      it('propagates "no-hide-descendants"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(
            <Button
              title="Hello"
              importantForAccessibility="no-hide-descendants"
            />,
          );
        });

        expect(
          root
            .getRenderedOutput({props: ['importantForAccessibility']})
            .toJSX(),
        ).toEqual(
          <rn-view importantForAccessibility="no-hide-descendants">
            <rn-paragraph>HELLO</rn-paragraph>
          </rn-view>,
        );
      });

      it('maps "no" to "no-hide-descendants"', () => {
        const root = Fantom.createRoot();

        Fantom.runTask(() => {
          root.render(<Button title="Hello" importantForAccessibility="no" />);
        });

        expect(
          root
            .getRenderedOutput({props: ['importantForAccessibility']})
            .toJSX(),
        ).toEqual(
          <rn-view importantForAccessibility="no-hide-descendants">
            <rn-paragraph>HELLO</rn-paragraph>
          </rn-view>,
        );
      });
    });
  });
});
