/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../../types/RNTesterTypes';

import ExampleTextInput from './ExampleTextInput';
import TextInputSharedExamples from './TextInputSharedExamples';
import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const ToggleDefaultPaddingExample = (): React.Node => {
  const [hasPadding, setHasPadding] = useState(false);

  return (
    <View>
      <ExampleTextInput style={hasPadding ? {padding: 0} : null} />
      <Text onPress={() => setHasPadding(!hasPadding)}>Toggle padding</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  multiline: {
    height: 60,
    fontSize: 16,
  },
  singleLine: {
    fontSize: 16,
  },
  singleLineWithHeightTextInput: {
    height: 30,
  },
  wrappedText: {
    maxWidth: 300,
  },
});

const examples: Array<RNTesterModuleExample> = [
  ...TextInputSharedExamples,
  {
    title: 'Colors and text inputs',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            style={[styles.singleLine]}
            defaultValue="Default color text"
          />
          <ExampleTextInput
            style={[styles.singleLine, {color: 'green'}]}
            defaultValue="Green Text"
          />
          <ExampleTextInput
            placeholder="Default placeholder text color"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="Red placeholder text color"
            placeholderTextColor="red"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="Default underline color"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="Blue underline color"
            style={styles.singleLine}
            underlineColorAndroid="blue"
          />
          <ExampleTextInput
            defaultValue="Same BackgroundColor as View "
            style={[
              styles.singleLine,
              {backgroundColor: 'rgba(100, 100, 100, 0.3)'},
            ]}>
            <Text style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
              Darker backgroundColor
            </Text>
          </ExampleTextInput>
          <ExampleTextInput
            defaultValue="Selection Color is red"
            selectionColor={'red'}
            style={styles.singleLine}
          />
          <ExampleTextInput
            defaultValue="Selection handles are red"
            selectionHandleColor={'red'}
            style={styles.singleLine}
          />
          <ExampleTextInput
            defaultValue="Cursor Color is red"
            cursorColor={'red'}
            style={styles.singleLine}
          />
        </View>
      );
    },
  },
  {
    title: 'Font Weight',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            defaultValue="Font Weight (default)"
            style={[styles.singleLine]}
          />
          {(
            [
              'normal',
              'bold',
              '900',
              800,
              '700',
              '600',
              '500',
              '400',
              '300',
              '200',
              '100',
            ] as const
          ).map(fontWeight => (
            <ExampleTextInput
              defaultValue={`Font Weight (${fontWeight})`}
              key={fontWeight}
              style={[styles.singleLine, {fontWeight}]}
            />
          ))}
        </View>
      );
    },
  },
  {
    title: 'Text input, themes and heights',
    render: function (): React.Node {
      return (
        <ExampleTextInput
          placeholder="If you set height, beware of padding set from themes"
          style={[styles.singleLineWithHeightTextInput]}
        />
      );
    },
  },
  {
    title: 'letterSpacing',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: 0}]}
            placeholder="letterSpacing = 0"
          />
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: 2}]}
            placeholder="letterSpacing = 2"
          />
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: 9}]}
            placeholder="letterSpacing = 9"
          />
          <ExampleTextInput
            style={[styles.singleLine, {letterSpacing: -1}]}
            placeholder="letterSpacing = -1"
          />
        </View>
      );
    },
  },
  {
    title: 'Passwords',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            defaultValue="iloveturtles"
            secureTextEntry={true}
            style={styles.singleLine}
          />
          <ExampleTextInput
            secureTextEntry={true}
            style={[styles.singleLine, {color: 'red'}]}
            placeholder="color is supported too"
            placeholderTextColor="red"
          />
        </View>
      );
    },
  },
  {
    title: 'Editable',
    render: function (): React.Node {
      return (
        <ExampleTextInput
          defaultValue="Can't touch this! (>'-')> ^(' - ')^ <('-'<) (>'-')> ^(' - ')^"
          editable={false}
          style={styles.singleLine}
        />
      );
    },
  },
  {
    title: 'Multiline',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            autoCorrect={true}
            placeholder="multiline, aligned top-left"
            placeholderTextColor="red"
            multiline={true}
            style={[
              styles.multiline,
              {textAlign: 'left', textAlignVertical: 'top'},
            ]}
          />
          <ExampleTextInput
            autoCorrect={true}
            placeholder="multiline, aligned center"
            placeholderTextColor="green"
            multiline={true}
            style={[
              styles.multiline,
              {textAlign: 'center', textAlignVertical: 'center'},
            ]}
          />
          <ExampleTextInput
            autoCorrect={true}
            multiline={true}
            style={[
              styles.multiline,
              {color: 'blue'},
              {textAlign: 'right', textAlignVertical: 'bottom'},
            ]}>
            <Text style={styles.multiline}>
              multiline with children, aligned bottom-right
            </Text>
          </ExampleTextInput>
        </View>
      );
    },
  },
  {
    title: 'Editable and Read only',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            placeholder="editable text input using editable prop"
            editable
          />
          <ExampleTextInput
            placeholder="uneditable text input using editable prop"
            editable={false}
          />
          <ExampleTextInput
            placeholder="editable text input using readOnly prop"
            readOnly={false}
          />
          <ExampleTextInput
            placeholder="uneditable text input using readOnly prop"
            readOnly
          />
        </View>
      );
    },
  },
  {
    title: 'Fixed number of lines',
    platform: 'android',
    render: function (): React.Node {
      return (
        <View style={styles.wrappedText}>
          <ExampleTextInput
            numberOfLines={2}
            multiline={true}
            placeholder="Two line input using numberOfLines prop"
          />
          <ExampleTextInput
            numberOfLines={5}
            multiline={true}
            placeholder="Five line input using numberOfLines prop"
          />
          <ExampleTextInput
            rows={2}
            multiline={true}
            placeholder="Two line input using rows prop"
          />
          <ExampleTextInput
            rows={5}
            multiline={true}
            placeholder="Five line input using rows prop"
          />
        </View>
      );
    },
  },
  {
    title: 'allowFontScaling attribute',
    render: function (): React.Node {
      return (
        <View>
          <Text>
            By default, text will respect Text Size accessibility setting on
            Android. It means that all font sizes will be increased or decreased
            depending on the value of the Text Size setting in the OS's Settings
            app.
          </Text>
          <ExampleTextInput
            placeholder="allowFontScaling = false"
            allowFontScaling={false}
          />
          <ExampleTextInput
            style={{marginTop: 10}}
            placeholder="allowFontScaling = false"
            allowFontScaling={true}
          />
        </View>
      );
    },
  },
  {
    title: 'maxFontSizeMultiplier attribute',
    name: 'maxFontSizeMultiplier',
    render(): React.Node {
      return (
        <View testID={'max-font-size-multiplier'}>
          <Text>
            When allowFontScaling is enabled, you can use the
            maxFontSizeMultiplier prop to set an upper limit on how much the
            font size will be scaled.
          </Text>
          <ExampleTextInput
            allowFontScaling={true}
            maxFontSizeMultiplier={1}
            placeholder="This text will not scale up (max 1x)"
            style={{marginTop: 10}}
            testID={'non-scalable-text-input'}
          />
          <ExampleTextInput
            allowFontScaling={true}
            maxFontSizeMultiplier={1.5}
            placeholder="This text will scale up (max 1.5x)"
            style={{marginTop: 10}}
            testID={'scalable-text-input'}
          />
        </View>
      );
    },
  },
  {
    title: 'Text Auto Complete',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput autoComplete="country" placeholder="country" />
          <ExampleTextInput
            autoComplete="postal-address-country"
            placeholder="postal-address-country"
          />
          <ExampleTextInput
            autoComplete="one-time-code"
            placeholder="one-time-code"
          />
          <ExampleTextInput
            autoComplete="2fa-app-otp"
            placeholder="2fa-app-otp"
          />
          <ExampleTextInput autoComplete="email-otp" placeholder="email-otp" />
          <ExampleTextInput
            autoComplete="flight-number"
            placeholder="flight-number"
          />
          <ExampleTextInput
            autoComplete="flight-confirmation-code"
            placeholder="flight-confirmation-code"
          />
          <ExampleTextInput
            autoComplete="gift-card-number"
            placeholder="gift-card-number"
          />
          <ExampleTextInput
            autoComplete="gift-card-pin"
            placeholder="gift-card-pin"
          />
          <ExampleTextInput
            autoComplete="loyalty-account-number"
            placeholder="loyalty-account-number"
          />
          <ExampleTextInput
            autoComplete="postal-address-unit"
            placeholder="postal-address-unit"
          />
          <ExampleTextInput
            autoComplete="postal-address-dependent-locality"
            placeholder="postal-address-dependent-locality"
          />
          <ExampleTextInput
            autoComplete="promo-code"
            placeholder="promo-code"
          />
          <ExampleTextInput autoComplete="sms-otp" placeholder="sms-otp" />
          <ExampleTextInput autoComplete="upi-vpa" placeholder="upi-vpa" />
          <ExampleTextInput
            autoComplete="wifi-password"
            placeholder="wifi-password"
          />
        </View>
      );
    },
  },
  {
    title: 'Return key',
    render: function (): React.Node {
      const returnKeyTypes = [
        'none',
        'go',
        'search',
        'send',
        'done',
        'previous',
        'next',
      ] as const;
      const returnKeyLabels = ['Compile', 'React Native'];
      const returnKeyExamples = returnKeyTypes.map(type => {
        return (
          <ExampleTextInput
            key={type}
            returnKeyType={type}
            placeholder={'returnKeyType: ' + type}
            style={styles.singleLine}
          />
        );
      });
      const types = returnKeyLabels.map(type => {
        return (
          <ExampleTextInput
            key={type}
            returnKeyLabel={type}
            placeholder={'returnKeyLabel: ' + type}
            style={styles.singleLine}
          />
        );
      });
      return (
        <View>
          {returnKeyExamples}
          {types}
        </View>
      );
    },
  },
  {
    title: 'Inline Images',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            inlineImageLeft="ic_menu_black_24dp"
            placeholder="This has drawableLeft set"
            style={styles.singleLine}
          />
          <ExampleTextInput
            inlineImageLeft="ic_menu_black_24dp"
            inlineImagePadding={30}
            placeholder="This has drawableLeft and drawablePadding set"
            style={styles.singleLine}
          />
          <ExampleTextInput
            placeholder="This does not have drawable props set"
            style={styles.singleLine}
          />
        </View>
      );
    },
  },
  {
    title: 'Toggle Default Padding',
    render: function (): React.Node {
      return <ToggleDefaultPaddingExample />;
    },
  },
  {
    title: 'Accessibility',
    render: function (): React.Node {
      return (
        <View>
          <Text>accessibilityLabel prop</Text>
          <ExampleTextInput accessibilityLabel="This is Accessibility Label" />
          <Text>aria-label prop</Text>
          <ExampleTextInput aria-label="This is Aria Label" />
        </View>
      );
    },
  },
];

module.exports = {
  displayName: undefined as ?string,
  title: 'TextInput',
  documentationURL: 'https://reactnative.dev/docs/textinput',
  category: 'Basic',
  description: 'Single and multi-line text inputs.',
  examples,
} as RNTesterModule;
