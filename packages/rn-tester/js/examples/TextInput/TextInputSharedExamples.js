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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {TextStyle} from 'react-native';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import ExampleTextInput from './ExampleTextInput';
import * as React from 'react';
import {createRef, memo, useContext, useState} from 'react';
import {
  Button,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  multiline: {
    height: 50,
    marginBottom: 4,
  },
  singleLine: {
    fontSize: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginVertical: 2,
  },
  label: {
    width: 115,
    textAlign: 'right',
    marginRight: 10,
    paddingTop: 2,
    fontSize: 12,
  },
  inputContainer: {
    flex: 1,
  },
  rewriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  remainder: {
    textAlign: 'right',
    width: 24,
  },
  hashtag: {
    color: 'blue',
    fontWeight: 'bold',
  },
  eventLabel: {
    margin: 3,
    fontSize: 12,
  },
  focusedUncontrolled: {
    margin: -2,
  },
  wrappedText: {
    maxWidth: 300,
  },
});

class AutoFocusWithSelectOnFocusTextExample extends React.Component<
  $FlowFixMe,
  any,
> {
  constructor(props: any | void) {
    super(props);
    this.state = {
      autoFocusFalse: 'autoFocus: false - selectTextOnFocus: true',
      autoFocusTrue: 'autoFocus: true - selectTextOnFocus: true',
    };
  }
  render(): React.Node {
    return (
      <View>
        <ExampleTextInput
          autoFocus={false}
          selectTextOnFocus={true}
          value={this.state.autoFocusFalse}
          onChangeText={text => this.setState({autoFocusFalse: text})}
          accessibilityLabel="I am the accessibility label for text input"
        />
        <ExampleTextInput
          autoFocus={true}
          selectTextOnFocus={true}
          value={this.state.autoFocusTrue}
          onChangeText={text => this.setState({autoFocusTrue: text})}
          accessibilityLabel="I am the accessibility label for text input"
        />
      </View>
    );
  }
}

class WithLabel extends React.Component<$FlowFixMe> {
  render(): React.Node {
    return (
      <View style={styles.labelContainer}>
        <RNTesterText style={styles.label}>{this.props.label}</RNTesterText>
        <View style={styles.inputContainer}>{this.props.children}</View>
      </View>
    );
  }
}

class RewriteExample extends React.Component<$FlowFixMe, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    const limit = 20;
    const remainder = limit - this.state.text.length;
    const remainderColor = remainder > 5 ? 'blue' : 'red';
    return (
      <View style={styles.rewriteContainer}>
        <ExampleTextInput
          testID="rewrite_sp_underscore_input"
          autoCorrect={false}
          multiline={false}
          maxLength={limit}
          onChangeText={text => {
            text = text.replace(/ /g, '_');
            this.setState({text});
          }}
          value={this.state.text}
        />
        <Text style={[styles.remainder, {color: remainderColor}]}>
          {remainder}
        </Text>
      </View>
    );
  }
}

class RewriteExampleInvalidCharacters extends React.Component<$FlowFixMe, any> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    return (
      <View style={styles.rewriteContainer}>
        <ExampleTextInput
          testID="rewrite_no_sp_input"
          autoCorrect={false}
          multiline={false}
          onChangeText={text => {
            this.setState({text: text.replace(/\s/g, '')});
          }}
          value={this.state.text}
        />
      </View>
    );
  }
}

class RewriteInvalidCharactersAndClearExample extends React.Component<
  $FlowFixMe,
  any,
> {
  inputRef: ?React.ElementRef<typeof TextInput> = null;

  constructor(props: any | void) {
    super(props);
    this.state = {text: ''};
  }
  render(): React.Node {
    return (
      <View style={styles.rewriteContainer}>
        <ExampleTextInput
          testID="rewrite_clear_input"
          autoCorrect={false}
          ref={ref => {
            this.inputRef = ref;
          }}
          multiline={true}
          onChangeText={text => {
            this.setState({text: text.replace(/ /g, '')});
          }}
          value={this.state.text}
        />
        <Button
          testID="rewrite_clear_button"
          onPress={() => {
            if (this.inputRef != null) {
              this.inputRef.clear();
            }
          }}
          title="Clear"
        />
      </View>
    );
  }
}

type ExampleRef = {current: null | React.ElementRef<typeof ExampleTextInput>};

class BlurOnSubmitExample extends React.Component<{...}> {
  ref1: ExampleRef = createRef();
  ref2: ExampleRef = createRef();
  ref3: ExampleRef = createRef();
  ref4: ExampleRef = createRef();
  ref5: ExampleRef = createRef();

  render(): React.Node {
    return (
      <View>
        <ExampleTextInput
          ref={this.ref1}
          style={styles.singleLine}
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref2.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref2}
          style={styles.singleLine}
          keyboardType="email-address"
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref3.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref3}
          style={styles.singleLine}
          keyboardType="url"
          placeholder="blurOnSubmit = false"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref4.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref4}
          style={styles.singleLine}
          keyboardType="numeric"
          placeholder="blurOnSubmit = false"
          blurOnSubmit={false}
          onSubmitEditing={() => this.ref5.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref5}
          style={styles.singleLine}
          keyboardType="numbers-and-punctuation"
          placeholder="blurOnSubmit = true"
          returnKeyType="done"
        />
      </View>
    );
  }
}

class SubmitBehaviorExample extends React.Component<{...}> {
  ref1: ExampleRef = createRef();
  ref2: ExampleRef = createRef();
  ref3: ExampleRef = createRef();
  ref4: ExampleRef = createRef();
  ref5: ExampleRef = createRef();
  ref6: ExampleRef = createRef();
  ref7: ExampleRef = createRef();
  ref8: ExampleRef = createRef();
  ref9: ExampleRef = createRef();
  ref10: ExampleRef = createRef();
  ref11: ExampleRef = createRef();

  render(): React.Node {
    return (
      <View>
        <ExampleTextInput
          ref={this.ref1}
          placeholder="single line submit"
          submitBehavior="submit"
          onSubmitEditing={() => this.ref2.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref2}
          placeholder="single line blurAndSubmit"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => this.ref3.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref3}
          placeholder="single line default"
          onSubmitEditing={() => this.ref4.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref4}
          blurOnSubmit
          placeholder="single line blurOnSubmit true"
          onSubmitEditing={() => this.ref5.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref5}
          blurOnSubmit={false}
          placeholder="single line blurOnSubmit false"
          onSubmitEditing={() => this.ref6.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref6}
          multiline
          placeholder="multiline submit"
          submitBehavior="submit"
          onSubmitEditing={() => this.ref7.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref7}
          multiline
          placeholder="multiline blurAndSubmit"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={() => this.ref8.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref8}
          multiline
          blurOnSubmit
          placeholder="multiline blurOnSubmit true"
          onSubmitEditing={() => this.ref9.current?.focus()}
        />
        <ExampleTextInput
          ref={this.ref9}
          multiline
          blurOnSubmit={false}
          placeholder="multiline blurOnSubmit false"
        />
        <ExampleTextInput
          ref={this.ref10}
          multiline
          placeholder="multiline newline"
          submitBehavior="newline"
        />
        <ExampleTextInput
          ref={this.ref11}
          multiline
          placeholder="multiline default"
        />
      </View>
    );
  }
}

class TextEventsExample extends React.Component<{...}, $FlowFixMe> {
  state:
    | any
    | {
        curText: string,
        prev2Text: string,
        prev3Text: string,
        prevText: string,
      } = {
    curText: '<No Event>',
    prevText: '<No Event>',
    prev2Text: '<No Event>',
    prev3Text: '<No Event>',
  };

  updateText = (text: string) => {
    this.setState(state => {
      return {
        curText: text,
        prevText: state.curText,
        prev2Text: state.prevText,
        prev3Text: state.prev2Text,
      };
    });
  };

  render(): React.Node {
    return (
      <View>
        <ExampleTextInput
          autoCapitalize="none"
          placeholder="Enter text to see events"
          autoCorrect={false}
          multiline
          onFocus={() => this.updateText('onFocus')}
          onBlur={() => this.updateText('onBlur')}
          onChange={event =>
            this.updateText(
              'onChange text: ' +
                event.nativeEvent.text +
                ', selection: ' +
                (event.nativeEvent.selection != null
                  ? JSON.stringify(event.nativeEvent.selection)
                  : 'undefined'),
            )
          }
          onContentSizeChange={event =>
            this.updateText(
              'onContentSizeChange size: ' +
                JSON.stringify(event.nativeEvent.contentSize),
            )
          }
          onEndEditing={event =>
            this.updateText('onEndEditing text: ' + event.nativeEvent.text)
          }
          onSubmitEditing={event =>
            this.updateText('onSubmitEditing text: ' + event.nativeEvent.text)
          }
          onKeyPress={event =>
            this.updateText('onKeyPress key: ' + event.nativeEvent.key)
          }
          style={styles.singleLine}
        />
        <RNTesterText style={styles.eventLabel}>
          {this.state.curText}
          {'\n'}
          (prev: {this.state.prevText}){'\n'}
          (prev2: {this.state.prev2Text}){'\n'}
          (prev3: {this.state.prev3Text})
        </RNTesterText>
      </View>
    );
  }
}

class TokenizedTextExample extends React.Component<$FlowFixMe, $FlowFixMe> {
  constructor(props: any | void) {
    super(props);
    this.state = {text: 'Hello #World'};
  }
  render(): React.Node {
    //define delimiter
    let delimiter = /\s+/;

    //split string
    let _text = this.state.text;
    let token,
      index,
      parts = [];
    while (_text) {
      delimiter.lastIndex = 0;
      token = delimiter.exec(_text);
      if (token === null) {
        break;
      }
      index = token.index;
      if (token[0].length === 0) {
        index = 1;
      }
      parts.push(_text.slice(0, index));
      parts.push(token[0]);
      index = index + token[0].length;
      _text = _text.slice(index);
    }
    parts.push(_text);

    //highlight hashtags
    parts = parts.map(text => {
      if (/^#/.test(text)) {
        return (
          <Text testID="hashtag" key={text} style={styles.hashtag}>
            {text}
          </Text>
        );
      } else {
        return text;
      }
    });

    return (
      <View style={{flexDirection: 'row'}}>
        <ExampleTextInput
          testID="text-input"
          multiline={true}
          style={styles.multiline}
          onChangeText={text => {
            this.setState({text});
          }}>
          <Text>{parts}</Text>
        </ExampleTextInput>
      </View>
    );
  }
}

type SelectionExampleState = {
  selection: Readonly<{
    start: number,
    end: number,
  }>,
  value: string,
  ...
};

class SelectionExample extends React.Component<
  $FlowFixMe,
  SelectionExampleState,
> {
  _textInput: React.ElementRef<typeof TextInput> | null = null;

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  constructor(props) {
    super(props);
    this.state = {
      selection: {start: 0, end: 0},
      value: props.value,
    };
  }

  /* $FlowFixMe[missing-local-annot] The type annotation(s) required by Flow's
   * LTI update could not be added via codemod */
  onSelectionChange({nativeEvent: {selection}}) {
    this.setState({selection});
  }

  getRandomPosition(): number {
    const length = this.state.value.length;
    return Math.round(Math.random() * length);
  }

  select(start: number, end: number) {
    this._textInput?.focus();
    this.setState({selection: {start, end}});
    if (this.props.imperative) {
      this._textInput?.setSelection(start, end);
    }
  }

  selectRandom() {
    const positions = [
      this.getRandomPosition(),
      this.getRandomPosition(),
    ].sort();
    this.select(...positions);
  }

  placeAt(position: number) {
    this.select(position, position);
  }

  placeAtRandom() {
    this.placeAt(this.getRandomPosition());
  }

  render(): React.Node {
    const length = this.state.value.length;

    return (
      <View>
        <View style={{flexDirection: 'row'}}>
          <ExampleTextInput
            testID={`${this.props.testID}-text-input`}
            multiline={this.props.multiline}
            onChangeText={value => this.setState({value})}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onSelectionChange={this.onSelectionChange.bind(this)}
            ref={textInput => (this._textInput = textInput)}
            selection={this.props.imperative ? undefined : this.state.selection}
            style={this.props.style}
            value={this.state.value}
          />
        </View>
        <View>
          <RNTesterText testID={`${this.props.testID}-selection`}>
            selection ={' '}
            {`{start:${this.state.selection.start},end:${this.state.selection.end}}`}
          </RNTesterText>
          <RNTesterText
            testID={`${this.props.testID}-cursor-start`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.placeAt.bind(this, 0)}>
            Place at Start (0, 0)
          </RNTesterText>
          <RNTesterText
            testID={`${this.props.testID}-cursor-end`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.placeAt.bind(this, length)}>
            Place at End ({length}, {length})
          </RNTesterText>
          {/* $FlowFixMe[method-unbinding] added when improving typing for this
           * parameters */}
          <RNTesterText onPress={this.placeAtRandom.bind(this)}>
            Place at Random
          </RNTesterText>
          <RNTesterText
            testID={`${this.props.testID}-select-all`}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onPress={this.select.bind(this, 0, length)}>
            Select All
          </RNTesterText>
          {/* $FlowFixMe[method-unbinding] added when improving typing for this
           * parameters */}
          <RNTesterText onPress={this.selectRandom.bind(this)}>
            Select Random
          </RNTesterText>
        </View>
      </View>
    );
  }
}

function UncontrolledExample() {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <ExampleTextInput
      defaultValue="Hello World!"
      testID="uncontrolled-textinput"
      style={isFocused ? styles.focusedUncontrolled : undefined}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
}

const TextStylesExample = memo(() => {
  const theme = useContext(RNTesterThemeContext);

  return (
    <TextStylesContainer
      examples={[
        {
          name: 'backgroundColor',
          textStyles: [
            {backgroundColor: theme.SystemBackgroundColor},
            {backgroundColor: 'red'},
            {backgroundColor: 'orange'},
            {backgroundColor: 'yellow'},
            {backgroundColor: 'green'},
            {backgroundColor: 'blue'},
          ],
        },
        {
          name: 'color',
          textStyles: [
            {color: theme.LabelColor},
            {color: 'red'},
            {color: 'orange'},
            {color: 'yellow'},
            {color: 'green'},
            {color: 'blue'},
          ],
        },
        {
          name: 'fontFamily',
          textStyles: [
            {fontFamily: 'sans-serif'},
            {fontFamily: 'serif'},
            {fontFamily: 'monospace'},
          ],
        },
        {
          name: 'fontSize',
          textStyles: [
            {fontSize: 8},
            {fontSize: 10},
            {fontSize: 12},
            {fontSize: 14},
            {fontSize: 16},
            {fontSize: 18},
          ],
        },
        {
          name: 'fontStyle',
          textStyles: [{fontStyle: 'normal'}, {fontStyle: 'italic'}],
        },
        {
          name: 'fontWeight',
          textStyles: [
            {fontWeight: 'normal'},
            {fontWeight: 'bold'},
            {fontWeight: '200'},
            {fontWeight: '400'},
            {fontWeight: '600'},
            {fontWeight: '800'},
          ],
        },
        {
          name: 'letterSpacing',
          textStyles: [
            {letterSpacing: 0},
            {letterSpacing: 1},
            {letterSpacing: 2},
            {letterSpacing: 3},
            {letterSpacing: 4},
            {letterSpacing: 5},
          ],
        },
        {
          name: 'lineHeight',
          multiline: true,
          textStyles: [
            {lineHeight: 4},
            {lineHeight: 8},
            {lineHeight: 16},
            {lineHeight: 24},
          ],
        },
        {
          name: 'textDecorationLine',
          textStyles: [
            {textDecorationLine: 'none'},
            {textDecorationLine: 'underline'},
            {textDecorationLine: 'line-through'},
            {textDecorationLine: 'underline line-through'},
          ],
        },
        {
          name: 'textShadow',
          textStyles: [
            {
              textShadowColor: 'black',
              textShadowOffset: {width: 0, height: 0},
              textShadowRadius: 0,
            },
            {
              textShadowColor: 'black',
              textShadowOffset: {width: 0, height: 0},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'red',
              textShadowOffset: {width: 0, height: 0},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'blue',
              textShadowOffset: {width: 0, height: -5},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'green',
              textShadowOffset: {width: 0, height: 5},
              textShadowRadius: 5,
            },
            {
              textShadowColor: 'orange',
              textShadowOffset: {width: 10, height: 0},
              textShadowRadius: 5,
            },
          ],
        },
      ]}
    />
  );
});

type TextStylesContainerProps = {
  examples: ReadonlyArray<{
    name: string,
    textStyles: ReadonlyArray<TextStyle>,
    multiline?: boolean,
  }>,
};

function TextStylesContainer({examples}: TextStylesContainerProps) {
  const [offset, setOffset] = useState(0);

  const MAX_CYCLES = 6;

  return (
    <View>
      <RNTesterButton
        testID="cycle-styles"
        textTestID="cycle-styles-label"
        onPress={() => setOffset((offset + 1) % MAX_CYCLES)}>
        Cycle {offset + 1}/{MAX_CYCLES}
      </RNTesterButton>
      <View testID="text-styles">
        {examples.map(({name, multiline, textStyles}) => (
          <WithLabel label={name} key={name}>
            {multiline ? (
              <MultilineStyledTextInput
                name={name}
                textStyles={textStyles}
                styleOffset={offset}
              />
            ) : (
              <StyledTextInput
                name={name}
                textStyles={textStyles}
                styleOffset={offset}
              />
            )}
          </WithLabel>
        ))}
      </View>
    </View>
  );
}

type StyledTextInputProps = {
  name: string,
  textStyles: ReadonlyArray<TextStyle>,
  styleOffset: number,
};

function StyledTextInput({
  name,
  textStyles,
  styleOffset,
}: StyledTextInputProps) {
  return (
    <ExampleTextInput
      style={textStyles[(0 + styleOffset) % textStyles.length]}
      testID={`style-${name}`}>
      <Text>He</Text>
      <Text style={textStyles[(1 + styleOffset) % textStyles.length]}>ll</Text>
      <Text style={textStyles[(2 + styleOffset) % textStyles.length]}>
        o,
        <Text style={textStyles[(0 + styleOffset) % textStyles.length]}> </Text>
      </Text>
      <Text style={textStyles[(3 + styleOffset) % textStyles.length]}>Wo</Text>
      <Text style={textStyles[(4 + styleOffset) % textStyles.length]}>rl</Text>
      <Text style={textStyles[(5 + styleOffset) % textStyles.length]}>d!</Text>
    </ExampleTextInput>
  );
}

function MultilineStyledTextInput({
  name,
  textStyles,
  styleOffset,
}: StyledTextInputProps) {
  return (
    <ExampleTextInput
      multiline={true}
      style={textStyles[(0 + styleOffset) % textStyles.length]}
      testID={`style-${name}`}>
      <Text>Hel{'\n'}</Text>
      <Text style={textStyles[(1 + styleOffset) % textStyles.length]}>
        lo {'\n'}
      </Text>
      <Text style={textStyles[(2 + styleOffset) % textStyles.length]}>
        Wor{'\n'}
      </Text>
      <Text style={textStyles[(3 + styleOffset) % textStyles.length]}>ld!</Text>
    </ExampleTextInput>
  );
}

function DynamicContentWidth() {
  const [text, setText] = useState('');
  const update = () => {
    const randomNumber = Math.floor(Math.random() * 10);
    setText(text + randomNumber);
  };

  return (
    <View>
      <RNTesterText>Uncontrolled:</RNTesterText>
      <TextInput
        testID="dynamic-width-uncontrolled-textinput"
        placeholder="Type..."
        style={{
          fontSize: 16,
          alignSelf: 'center',
          backgroundColor: 'orange',
        }}
      />
      <RNTesterText>Controlled:</RNTesterText>
      <TextInput
        testID="dynamic-width-controlled-textinput"
        placeholder="..."
        value={text}
        onChangeText={setText}
        style={{
          fontSize: 16,
          alignSelf: 'center',
          backgroundColor: 'orange',
        }}
      />
      <Button title="Update controlled Input" onPress={update} />
    </View>
  );
}

function AutogrowingTextInputExample({
  style,
  ...props
}: React.ElementConfig<typeof TextInput>) {
  const [multiline, setMultiline] = useState(true);
  const [fullWidth, setFullWidth] = useState(true);
  const [text, setText] = useState('');
  const [contentSize, setContentSize] = useState({width: 0, height: 0});

  return (
    <View>
      <RNTesterText>Full width:</RNTesterText>
      <Switch value={fullWidth} onValueChange={setFullWidth} />

      <RNTesterText>Multiline:</RNTesterText>
      <Switch value={multiline} onValueChange={setMultiline} />

      <RNTesterText>TextInput:</RNTesterText>
      <ExampleTextInput
        multiline={multiline}
        style={[style, {width: fullWidth ? '100%' : '50%'}]}
        onChangeText={setText}
        onContentSizeChange={({nativeEvent}) => {
          setContentSize({
            width: nativeEvent.contentSize.width,
            height: nativeEvent.contentSize.height,
          });
        }}
        {...props}
      />
      <RNTesterText>Plain text value representation:</RNTesterText>
      <RNTesterText>{text}</RNTesterText>
      <RNTesterText>Content Size: {JSON.stringify(contentSize)}</RNTesterText>
    </View>
  );
}

module.exports = [
  {
    title: 'Auto-focus & select text on focus',
    render: function (): React.Node {
      return <AutoFocusWithSelectOnFocusTextExample />;
    },
  },
  {
    name: 'maxLength',
    title: "Live Re-Write (<sp>  ->  '_') + maxLength",
    render: function (): React.Node {
      return <RewriteExample />;
    },
  },
  {
    title: 'Live Re-Write (no spaces allowed)',
    render: function (): React.Node {
      return <RewriteExampleInvalidCharacters />;
    },
  },
  {
    name: 'clearButton',
    title: 'Live Re-Write (no spaces allowed) and clear',
    render: function (): React.Node {
      return <RewriteInvalidCharactersAndClearExample />;
    },
  },
  {
    title: 'Auto-capitalize',
    name: 'autoCapitalize',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="none">
            <ExampleTextInput testID="capitalize-none" autoCapitalize="none" />
          </WithLabel>
          <WithLabel label="sentences">
            <ExampleTextInput
              testID="capitalize-sentences"
              autoCapitalize="sentences"
            />
          </WithLabel>
          <WithLabel label="words">
            <ExampleTextInput
              testID="capitalize-words"
              autoCapitalize="words"
            />
          </WithLabel>
          <WithLabel label="characters">
            <ExampleTextInput
              testID="capitalize-characters"
              autoCapitalize="characters"
            />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Auto-correct',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="true">
            <ExampleTextInput autoCorrect={true} />
          </WithLabel>
          <WithLabel label="false">
            <ExampleTextInput autoCorrect={false} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Keyboard types',
    name: 'keyboardTypes',
    render: function (): React.Node {
      const keyboardTypes = [
        'default',
        'ascii-capable',
        'numbers-and-punctuation',
        'url',
        'number-pad',
        'phone-pad',
        'name-phone-pad',
        'email-address',
        'decimal-pad',
        'twitter',
        'web-search',
        'ascii-capable-number-pad',
        'numeric',
      ] as const;
      const examples = keyboardTypes.map(type => {
        return (
          <WithLabel key={type} label={type}>
            <ExampleTextInput keyboardType={type} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Input modes',
    name: 'inputModes',
    render: function (): React.Node {
      const inputMode = [
        'none',
        'text',
        'decimal',
        'numeric',
        'tel',
        'search',
        'email',
        'url',
      ] as const;
      const examples = inputMode.map(mode => {
        return (
          <WithLabel key={mode} label={mode}>
            <ExampleTextInput inputMode={mode} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Blur on submit',
    render: function (): React.MixedElement {
      return <BlurOnSubmitExample />;
    },
  },
  {
    title: 'enterKeyHint modes',
    name: 'enterKeyHintTypes',
    render: function (): React.Node {
      const enterKeyHintTypesHints = [
        'enter',
        'done',
        'go',
        'next',
        'previous',
        'search',
        'send',
      ] as const;
      const examples = enterKeyHintTypesHints.map(hint => {
        return (
          <WithLabel key={hint} label={hint}>
            <ExampleTextInput enterKeyHint={hint} />
          </WithLabel>
        );
      });
      return <View>{examples}</View>;
    },
  },
  {
    title: 'Submit behavior',
    render: function (): React.MixedElement {
      return <SubmitBehaviorExample />;
    },
  },
  {
    title: 'Event handling',
    render: function (): React.MixedElement {
      return <TextEventsExample />;
    },
  },
  {
    title: 'fontFamily, fontWeight and fontStyle',
    render: function (): React.Node {
      const fontFamilyA = Platform.OS === 'ios' ? 'Cochin' : 'sans-serif';
      const fontFamilyB = Platform.OS === 'ios' ? 'Courier' : 'serif';

      return (
        <View>
          <ExampleTextInput
            style={[styles.singleLine, {fontFamily: fontFamilyA}]}
            placeholder={`Custom fonts like ${fontFamilyA} are supported`}
          />
          <ExampleTextInput
            style={[
              styles.singleLine,
              {fontFamily: fontFamilyA, fontWeight: 'bold'},
            ]}
            placeholder={`${fontFamilyA} bold`}
          />
          <ExampleTextInput
            style={[
              styles.singleLine,
              {fontFamily: fontFamilyA, fontWeight: '500'},
            ]}
            placeholder={`${fontFamilyA} 500`}
          />
          <ExampleTextInput
            style={[
              styles.singleLine,
              {fontFamily: fontFamilyA, fontStyle: 'italic'},
            ]}
            placeholder={`${fontFamilyA} italic`}
          />
          <ExampleTextInput
            style={[styles.singleLine, {fontFamily: fontFamilyB}]}
            placeholder={fontFamilyB}
          />
        </View>
      );
    },
  },
  {
    title: 'Attributed text',
    name: 'attributedText',
    render: function (): React.Node {
      return <TokenizedTextExample />;
    },
  },
  {
    title: 'Text selection & cursor placement',
    name: 'cursorPlacement',
    render: function (): React.Node {
      return (
        <View>
          <SelectionExample
            testID="singleline"
            value="text selection can be changed"
          />
          <SelectionExample
            testID="multiline"
            multiline
            style={styles.multiline}
            value={'multiline text selection\ncan also be changed'}
          />
        </View>
      );
    },
  },
  {
    title: 'Text selection & cursor placement (imperative)',
    name: 'cursorPlacementImperative',
    render: function (): React.Node {
      return (
        <View>
          <SelectionExample
            testID="singlelineImperative"
            value="text selection can be changed imperatively"
            imperative={true}
          />
          <SelectionExample
            testID="multilineImperative"
            multiline
            style={styles.multiline}
            value={'multiline text selection\ncan also be changed imperatively'}
            imperative={true}
          />
        </View>
      );
    },
  },
  {
    title: 'Uncontrolled component with layout changes',
    name: 'uncontrolledComponent',
    render: () => <UncontrolledExample />,
  },
  {
    title: 'Text styles',
    name: 'textStyles',
    render: () => <TextStylesExample />,
  },
  {
    title: 'showSoftInputOnFocus',
    render: function (): React.Node {
      return (
        <View>
          <WithLabel label="showSoftInputOnFocus: false">
            <ExampleTextInput showSoftInputOnFocus={false} />
          </WithLabel>
        </View>
      );
    },
  },
  {
    title: 'Clipping',
    name: 'clipping',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            multiline={true}
            testID="textinput-clipping"
            style={{
              borderRadius: 50,
              padding: 0,
              borderColor: 'red',
              borderWidth: 5,
              overflow: 'hidden',
              fontSize: 16,
            }}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </ExampleTextInput>
        </View>
      );
    },
  },
  {
    title: 'Dynamic content width',
    name: 'dynamicWidth',
    render: function (): React.Node {
      return <DynamicContentWidth />;
    },
  },
  {
    title: 'Auto-expanding',
    render: function (): React.Node {
      return (
        <View style={styles.wrappedText}>
          <AutogrowingTextInputExample
            enablesReturnKeyAutomatically={true}
            returnKeyType="done"
            style={{maxHeight: 400, minHeight: 20, backgroundColor: '#eeeeee'}}>
            generic generic generic
            <Text style={{fontSize: 6, color: 'red'}}>
              small small small small small small
            </Text>
            <Text>regular regular</Text>
            <Text style={{fontSize: 30, color: 'green'}}>
              huge huge huge huge huge
            </Text>
            generic generic generic
          </AutogrowingTextInputExample>
        </View>
      );
    },
  },
  {
    title: 'Drag and drop',
    render: function (): React.Node {
      return (
        <View>
          <ExampleTextInput
            experimental_acceptDragAndDropTypes={[]}
            placeholder="Does not accept drag drops"
          />
          <ExampleTextInput
            experimental_acceptDragAndDropTypes={
              Platform.OS === 'android' ? ['text/plain'] : ['public.plain-text']
            }
            placeholder="Only accepts plaintext drag drops"
          />
          <ExampleTextInput
            experimental_acceptDragAndDropTypes={
              Platform.OS === 'android' ? ['text/plain'] : ['public.plain-text']
            }
            multiline={true}
            numberOfLines={3}
            placeholder="Only accepts plaintext drag drops"
            style={{
              height: 60,
            }}
          />
          <ExampleTextInput
            experimental_acceptDragAndDropTypes={null}
            placeholder="Accepts all drag drops"
          />
        </View>
      );
    },
  },
] as Array<RNTesterModuleExample>;
