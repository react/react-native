/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../../types/RNTesterTypes';
import type {KeyboardTypeOptions} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import ExampleTextInput from './ExampleTextInput';
import TextInputSharedExamples from './TextInputSharedExamples';
import * as React from 'react';
import {useRef} from 'react';
import {
  Alert,
  Button,
  InputAccessoryView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

class WithLabel extends React.Component<$FlowFixMe> {
  render(): React.Node {
    return (
      <View style={styles.labelContainer}>
        <View style={styles.label}>
          <RNTesterText>{this.props.label}</RNTesterText>
        </View>
        {this.props.children}
      </View>
    );
  }
}

class TextInputAccessoryViewChangeTextExample extends React.Component<
  {...},
  {text: string},
> {
  constructor(props: void | {...}) {
    // $FlowFixMe[incompatible-type]
    super(props);
    this.state = {text: 'Placeholder Text'};
  }

  render(): React.Node {
    const inputAccessoryViewID = 'inputAccessoryView1';
    return (
      <View>
        <RNTesterText>
          Set InputAccessoryView with ID & reset text:
        </RNTesterText>
        <ExampleTextInput
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={text => this.setState({text})}
          value={this.state.text}
        />
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{backgroundColor: 'white'}}>
            <Button
              onPress={() => this.setState({text: 'Placeholder Text'})}
              title="Reset Text"
            />
          </View>
        </InputAccessoryView>
      </View>
    );
  }
}

class TextInputAccessoryViewChangeKeyboardExample extends React.Component<
  {...},
  {keyboardType: string, text: string},
> {
  constructor(props: void | {...}) {
    // $FlowFixMe[incompatible-type]
    super(props);
    this.state = {text: '', keyboardType: 'default'};
  }

  _switchKeyboard = () => {
    this.setState({
      keyboardType:
        this.state.keyboardType === 'default' ? 'number-pad' : 'default',
    });
  };

  render(): React.Node {
    const inputAccessoryViewID = 'inputAccessoryView2';
    return (
      <View>
        <RNTesterText>
          Set InputAccessoryView with ID & switch keyboard:
        </RNTesterText>
        {/* $FlowFixMe[incompatible-use] */}
        <ExampleTextInput
          inputAccessoryViewID={inputAccessoryViewID}
          onChangeText={text => this.setState({text})}
          value={this.state.text}
          // $FlowFixMe[incompatible-type]
          keyboardType={this.state.keyboardType}
          returnKeyType="done"
        />
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <View style={{backgroundColor: 'white'}}>
            <Button onPress={this._switchKeyboard} title="Switch Keyboard" />
          </View>
        </InputAccessoryView>
      </View>
    );
  }
}

class TextInputAccessoryViewDefaultDoneButtonExample extends React.Component<
  Readonly<{
    keyboardType: KeyboardTypeOptions,
  }>,
  {text: string},
> {
  constructor(props: void | Readonly<{keyboardType: KeyboardTypeOptions}>) {
    // $FlowFixMe[incompatible-type]
    super(props);
    this.state = {text: ''};
  }

  render(): React.Node {
    return (
      <ExampleTextInput
        onChangeText={text => this.setState({text})}
        value={this.state.text}
        keyboardType={this.props.keyboardType}
        returnKeyType="done"
      />
    );
  }
}

class RewriteExampleKana extends React.Component<$FlowFixMe, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    return (
      <View style={styles.rewriteContainer}>
        <ExampleTextInput
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/ひ/g, '日')});
          }}
          value={this.state.text}
        />
      </View>
    );
  }
}

class SecureEntryExample extends React.Component<$FlowFixMe, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {
      text: '',
      password: '',
      isSecureTextEntry: true,
    };
  }
  render(): React.Node {
    return (
      <View>
        <ExampleTextInput
          secureTextEntry={true}
          defaultValue="abc"
          onChangeText={text => this.setState({text})}
          value={this.state.text}
        />
        <RNTesterText>Current text is: {this.state.text}</RNTesterText>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
          }}>
          <ExampleTextInput
            defaultValue="cde"
            onChangeText={text => this.setState({password: text})}
            secureTextEntry={this.state.isSecureTextEntry}
            value={this.state.password}
          />
          <Switch
            onValueChange={value => {
              this.setState({isSecureTextEntry: value});
            }}
            style={{marginLeft: 4}}
            value={this.state.isSecureTextEntry}
          />
        </View>
      </View>
    );
  }
}

const TextInputWithFocusButton = () => {
  const inputToFocusRef = useRef<React.ElementRef<typeof TextInput> | null>(
    null,
  );
  return (
    <View>
      <ExampleTextInput
        ref={inputToFocusRef}
        placeholder="height increases with content"
        defaultValue="React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. The focus of React Native is on developer efficiency across all the platforms you care about - learn once, write anywhere. Facebook uses React Native in multiple production apps and will continue investing in React Native."
        multiline={true}
        enablesReturnKeyAutomatically={true}
        returnKeyType="go"
        style={[styles.multiline, styles.multilineExpandable]}
      />
      <Button
        title="Focus"
        onPress={() => {
          inputToFocusRef.current?.focus();
        }}
      />
    </View>
  );
};

function KeyboardShortcutsExample() {
  return (
    <View>
      <Text
        style={{
          marginBottom: 4,
        }}>
        Single line:
      </Text>

      <ExampleTextInput
        style={{
          marginBottom: 4,
        }}
        placeholder="Default"
      />

      <ExampleTextInput
        style={{
          marginBottom: 4,
        }}
        placeholder="Disable keyboard shortcuts"
        disableKeyboardShortcuts
      />

      <ExampleTextInput
        style={{
          marginBottom: 4,
        }}
        placeholder="Hidden keyboard with suggestions"
        showSoftInputOnFocus={false}
      />

      <ExampleTextInput
        style={{
          marginBottom: 4,
        }}
        placeholder="Hidden keyboard without suggestions"
        disableKeyboardShortcuts
        autoCorrect={false}
        spellCheck={false}
        showSoftInputOnFocus={false}
      />

      <Text
        style={{
          marginBottom: 4,
        }}>
        Multiline:
      </Text>

      <ExampleTextInput
        style={styles.multiline}
        multiline
        placeholder="default"
      />

      <ExampleTextInput
        style={styles.multiline}
        multiline
        placeholder="Disable keyboard shortcuts"
        disableKeyboardShortcuts
      />
    </View>
  );
}

const styles = StyleSheet.create({
  multiline: {
    height: 50,
  },
  multilinePlaceholderStyles: {
    letterSpacing: 10,
    lineHeight: 20,
    textAlign: 'center',
  },
  multilineExpandable: {
    height: 'auto',
    maxHeight: 100,
  },
  multilineWithFontStyles: {
    color: 'blue',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Cochin',
    height: 60,
  },
  singlelinePlaceholderStyles: {
    letterSpacing: 10,
    textAlign: 'center',
  },
  labelContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  label: {
    width: 115,
    alignItems: 'flex-end',
    marginRight: 10,
    paddingTop: 2,
  },
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
});

const textInputExamples: Array<RNTesterModuleExample> = [
  ...TextInputSharedExamples,
  {
    title: 'Live Re-Write (ひ -> 日)',
    render: function (): React.Node {
      return <RewriteExampleKana />;
    },
  },
  {
    title: 'Keyboard Input Accessory View',
    render: function (): React.Node {
      return (
        <View>
          <TextInputAccessoryViewChangeTextExample />
          <TextInputAccessoryViewChangeKeyboardExample />
        </View>
      );
    },
  },
  {
    title: "Default Input Accessory View with returnKeyType = 'done'",
    render: function (): React.Node {
      const keyboardTypesWithDoneButton = [
        'number-pad',
        'phone-pad',
        'decimal-pad',
        'ascii-capable-number-pad',
      ] as const;
      const examples = keyboardTypesWithDoneButton.map(type => {
        return (
          <WithLabel key={'keyboardType: ' + type} label={type}>
            <TextInputAccessoryViewDefaultDoneButtonExample
              key={type}
              keyboardType={type}
            />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Custom Input Accessory View Button Label',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="Localized Label">
            <ExampleTextInput
              keyboardType="number-pad"
              inputAccessoryViewButtonLabel="Presiona aquí para terminar"
            />
          </WithLabel>
          <WithLabel label="Custom Label">
            <ExampleTextInput
              keyboardType="ascii-capable-number-pad"
              inputAccessoryViewButtonLabel="Press here to finish"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Nested content and `value` property',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="singleline">
            <ExampleTextInput value="(value property)">
              (first raw text node)
              <Text style={{color: 'red'}}>(internal raw text node)</Text>
              (last raw text node)
            </ExampleTextInput>
          </WithLabel>
          <WithLabel label="multiline">
            <ExampleTextInput multiline={true} value="(value property)">
              (first raw text node)
              <Text style={{color: 'red'}}>(internal raw text node)</Text>
              (last raw text node)
            </ExampleTextInput>
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Keyboard appearance',
    render: function (): React.Node {
      const keyboardAppearance = ['default', 'light', 'dark'] as const;
      const examples = keyboardAppearance.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <ExampleTextInput keyboardAppearance={type} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Return key types',
    render: function (): React.Node {
      const returnKeyTypes = [
        'default',
        'go',
        'google',
        'join',
        'next',
        'route',
        'search',
        'send',
        'yahoo',
        'done',
        'emergency-call',
      ] as const;
      const examples = returnKeyTypes.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <ExampleTextInput returnKeyType={type} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Enable return key automatically',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="true">
            <ExampleTextInput enablesReturnKeyAutomatically={true} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Secure text entry',
    render: function (): React.Node {
      return <SecureEntryExample />;
    },
  },
  {
    title: 'Colored input text',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput style={{color: 'blue'}} defaultValue="Blue" />
          <ExampleTextInput style={{color: 'green'}} defaultValue="Green" />
        </View>
      );
    },
  },
  {
    title: 'Colored highlight/cursor for text input',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            selectionColor={'green'}
            defaultValue="Highlight me"
          />
          <ExampleTextInput
            selectionColor={'rgba(86, 76, 205, 1)'}
            defaultValue="Highlight me"
          />
        </View>
      );
    },
  },
  {
    title: 'Clear button mode',
    render: function (): React.Node {
      const clearButtonModes = [
        'never',
        'while-editing',
        'unless-editing',
        'always',
      ] as const;
      const examples = clearButtonModes.map(mode => {
        return (
          <WithLabel key={mode} label={mode}>
            <ExampleTextInput clearButtonMode={mode} defaultValue={mode} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Clear and select',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="clearTextOnFocus">
            <ExampleTextInput
              placeholder="text is cleared on focus"
              defaultValue="text is cleared on focus"
              clearTextOnFocus={true}
            />
          </WithLabel>
          <WithLabel label="selectTextOnFocus">
            <ExampleTextInput
              placeholder="text is selected on focus"
              defaultValue="text is selected on focus"
              selectTextOnFocus={true}
            />
          </WithLabel>
          <WithLabel label="clearTextOnFocus (multiline)">
            <ExampleTextInput
              placeholder="text is cleared on focus"
              defaultValue="text is cleared on focus"
              clearTextOnFocus={true}
              multiline={true}
            />
          </WithLabel>
          <WithLabel label="selectTextOnFocus (multiline)">
            <ExampleTextInput
              placeholder="text is selected on focus"
              defaultValue="text is selected on focus"
              selectTextOnFocus={true}
              multiline={true}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Multiline blur on submit',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            style={styles.multiline}
            placeholder="blurOnSubmit = true"
            returnKeyType="next"
            blurOnSubmit={true}
            multiline={true}
            onSubmitEditing={event =>
              Alert.alert('Alert', event.nativeEvent.text)
            }
          />
        </View>
      );
    },
  },
  {
    title: 'Multiline',
    render: function (): React.Node {
      return (
        <View style={{gap: 4}}>
          <ExampleTextInput
            placeholder="multiline text input"
            multiline={true}
            style={styles.multiline}
          />
          <ExampleTextInput
            placeholder="multiline text input with font styles and placeholder"
            multiline={true}
            clearTextOnFocus={true}
            autoCorrect={true}
            autoCapitalize="words"
            placeholderTextColor="red"
            keyboardType="url"
            style={[styles.multiline, styles.multilineWithFontStyles]}
          />
          <ExampleTextInput
            placeholder="multiline text input with max length"
            maxLength={5}
            multiline={true}
            style={styles.multiline}
          />
          <ExampleTextInput
            placeholder="multiline text input with max 4 lines"
            numberOfLines={4}
            multiline={true}
          />
          <ExampleTextInput
            placeholder="uneditable multiline text input"
            editable={false}
            multiline={true}
            style={styles.multiline}
          />
          <ExampleTextInput
            defaultValue="uneditable multiline text input with phone number detection: 88888888."
            editable={false}
            multiline={true}
            style={styles.multiline}
            dataDetectorTypes="phoneNumber"
          />
          <ExampleTextInput
            dataDetectorTypes={['link', 'phoneNumber']}
            defaultValue={
              'link: http://reactnative.dev, photo number: 88888888'
            }
            multiline
            editable={false}
          />
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
    title: 'TextInput Intrinsic Size',
    render: function (): React.Node {
      return (
        <View>
          <RNTesterText>Singleline TextInput</RNTesterText>
          <View style={{height: 80}}>
            <ExampleTextInput
              style={{
                position: 'absolute',
                fontSize: 16,
                backgroundColor: '#eeeeee',
                borderColor: '#666666',
                borderWidth: 5,
                borderTopWidth: 20,
                borderRadius: 10,
                borderBottomRightRadius: 20,
                padding: 10,
                paddingTop: 20,
              }}
              testID="singleline_textinput"
              placeholder="Placeholder defines intrinsic size"
            />
          </View>
          <RNTesterText>Multiline TextInput</RNTesterText>
          <View style={{height: 80}}>
            <ExampleTextInput
              style={{
                position: 'absolute',
                fontSize: 16,
                backgroundColor: '#eeeeee',
                borderColor: '#666666',
                borderWidth: 5,
                borderTopWidth: 20,
                borderRadius: 10,
                borderBottomRightRadius: 20,
                padding: 10,
                paddingTop: 20,
                maxHeight: 100,
              }}
              testID="multiline_textinput"
              multiline={true}
              placeholder="Placeholder defines intrinsic size"
            />
          </View>
          <RNTesterText>Multiline TextInput with flex</RNTesterText>
          <View>
            <ExampleTextInput
              style={{
                fontSize: 16,
                backgroundColor: '#eeeeee',
                borderColor: '#666666',
                borderWidth: 5,
                borderTopWidth: 20,
                borderRadius: 10,
                borderBottomRightRadius: 20,
                padding: 10,
                paddingTop: 20,
              }}
              testID="multiline_textinput_with_flex"
              multiline={true}
              placeholder="Placeholder defines intrinsic size"
            />
          </View>
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
            iOS. It means that all font sizes will be increased or decreased
            depending on the value of Text Size setting in{' '}
            <Text style={{fontWeight: 'bold'}}>
              Settings.app - Display & Brightness - Text Size
            </Text>
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
    title: 'Auto-expanding',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            placeholder="height increases with content"
            defaultValue="React Native enables you to build world-class application experiences on native platforms using a consistent developer experience based on JavaScript and React. The focus of React Native is on developer efficiency across all the platforms you care about - learn once, write anywhere. Facebook uses React Native in multiple production apps and will continue investing in React Native."
            multiline={true}
            enablesReturnKeyAutomatically={true}
            returnKeyType="go"
            style={[styles.multiline, styles.multilineExpandable]}
          />
        </View>
      );
    },
  },
  {
    title: 'TextInput maxLength',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="maxLength: 5">
            <ExampleTextInput maxLength={5} />
          </WithLabel>
          <WithLabel label="maxLength: 5 with placeholder">
            <ExampleTextInput maxLength={5} placeholder="ZIP code entry" />
          </WithLabel>
          <WithLabel label="maxLength: 5 with default value already set">
            <ExampleTextInput maxLength={5} defaultValue="94025" />
          </WithLabel>
          <WithLabel label="maxLength: 5 with very long default value already set">
            <ExampleTextInput maxLength={5} defaultValue="9402512345" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Text Auto Complete',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="country">
            <ExampleTextInput autoComplete="country" />
          </WithLabel>
          <WithLabel label="one-time-code">
            <ExampleTextInput autoComplete="one-time-code" />
          </WithLabel>
          <WithLabel label="birthdate-full">
            <ExampleTextInput autoComplete="birthdate-full" />
          </WithLabel>
          <WithLabel label="cc-name">
            <ExampleTextInput autoComplete="cc-name" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Text Content Type',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="emailAddress">
            <ExampleTextInput textContentType="emailAddress" />
          </WithLabel>
          <WithLabel label="name">
            <ExampleTextInput textContentType="name" />
          </WithLabel>
          <WithLabel label="postalCode, when autoComplete set">
            <ExampleTextInput
              textContentType="postalCode"
              autoComplete="email"
            />
          </WithLabel>
          <WithLabel label="creditCardExpiration">
            <ExampleTextInput textContentType="creditCardExpiration" />
          </WithLabel>
          <WithLabel label="birthdate">
            <ExampleTextInput textContentType="birthdate" />
          </WithLabel>
          <WithLabel label="dateTime">
            <ExampleTextInput textContentType="dateTime" />
          </WithLabel>
          <WithLabel label="flightNumber">
            <ExampleTextInput textContentType="flightNumber" />
          </WithLabel>
          <WithLabel label="shipmentTrackingNumber">
            <ExampleTextInput textContentType="shipmentTrackingNumber" />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'TextInput Placeholder Styles',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="letterSpacing: 10 lineHeight: 20 textAlign: 'center'">
            <ExampleTextInput
              placeholder="multiline text input"
              multiline={true}
              style={[styles.multiline, styles.multilinePlaceholderStyles]}
            />
          </WithLabel>
          <WithLabel label="letterSpacing: 10 textAlign: 'center'">
            <ExampleTextInput
              placeholder="singleline"
              style={styles.singlelinePlaceholderStyles}
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Line Break Strategy',
    render: function (): React.Node {
      const lineBreakStrategy = [
        'none',
        'standard',
        'hangul-word',
        'push-out',
      ] as const;
      const textByCode = {
        en: 'lineBreakStrategy lineBreakStrategy lineBreakStrategy lineBreakStrategy',
        ko: '한글개행한글개행 한글개행한글개행 한글개행한글개행 한글개행한글개행 한글개행한글개행 한글개행한글개행',
        ja: 'かいぎょう かいぎょう かいぎょう かいぎょう かいぎょう かいぎょう',
        cn: '改行 改行 改行 改行 改行 改行 改行 改行 改行 改行 改行 改行',
      };
      return (
        <View>
          {lineBreakStrategy.map(strategy => {
            return (
              <View key={strategy} style={{marginBottom: 12}}>
                <Text
                  style={{
                    backgroundColor: 'lightgrey',
                  }}>{`Strategy: ${strategy}`}</Text>
                {Object.keys(textByCode).map(code => {
                  return (
                    <View key={code}>
                      <RNTesterText
                        style={{
                          fontWeight: 'bold',
                        }}>{`[${code}]`}</RNTesterText>
                      <ExampleTextInput
                        multiline
                        lineBreakStrategyIOS={strategy}
                        defaultValue={textByCode[code]}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'iOS autoformatting behaviors',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="smartInsertDelete: true | undefined">
            <ExampleTextInput defaultValue="CopyAndPaste" />
          </WithLabel>
          <WithLabel label="smartInsertDelete: false">
            <ExampleTextInput
              smartInsertDelete={false}
              defaultValue="CopyAndPaste"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Auto scroll cursor into view when focusing',
    render: function (): React.Node {
      return <TextInputWithFocusButton />;
    },
  },
  {
    title: 'Keyboard shortcuts',
    render: function (): React.Node {
      return <KeyboardShortcutsExample />;
    },
  },
  {
    title: 'Line Break Mode',
    render: function (): React.Node {
      const lineBreakMode = [
        'wordWrapping',
        'char',
        'clip',
        'head',
        'middle',
        'tail',
      ] as const;
      const textByCode = {
        en: 'verylongtext-dummydummydummydummydummydummydummydummydummydummydummydummy',
        ko: '한글개행한글개행-한글개행한글개행한글개행한글개행한글개행한글개행한글개행한글개행한글개행한글개행',
      };
      return (
        <View>
          {lineBreakMode.map(strategy => {
            return (
              <View key={strategy} style={{marginBottom: 12}}>
                <Text
                  style={{
                    backgroundColor: 'lightgrey',
                  }}>{`Mode: ${strategy}`}</Text>
                {Object.keys(textByCode).map(code => {
                  return (
                    <View key={code}>
                      <RNTesterText
                        style={{
                          fontWeight: 'bold',
                        }}>{`[${code}]`}</RNTesterText>
                      <ExampleTextInput
                        lineBreakModeIOS={strategy}
                        defaultValue={textByCode[code]}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      );
    },
  },
  {
    title: 'Accessibility',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="accessibilityLabel">
            <ExampleTextInput accessibilityLabel="This is Accessibility Label" />
          </WithLabel>
          <WithLabel label="aria-label">
            <ExampleTextInput aria-label="This is Aria Label" />
          </WithLabel>
        </View>
      );
    },
  },
];

module.exports = {
  displayName: undefined as ?string,
  title: 'TextInput',
  documentationURL: 'https://reactnative.dev/docs/TextInput',
  category: 'Basic',
  description: 'Single and multi-line text inputs.',
  examples: textInputExamples,
} as RNTesterModule;
