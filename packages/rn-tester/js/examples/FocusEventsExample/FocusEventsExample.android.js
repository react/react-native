/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import {useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

type SectionProps = {
  children: React.Node,
};

const FocusEventSection = ({children}: SectionProps): React.Node => {
  const [outerFocused, setOuterFocused] = useState(false);

  return (
    <View
      onFocus={() => setOuterFocused(true)}
      onBlur={() => setOuterFocused(false)}>
      <RNTesterText style={styles.sectionSubtitle}>
        Section focused: {outerFocused ? 'true' : 'false'}
      </RNTesterText>
      {children}
    </View>
  );
};

type ViewExampleInnerRowProps = {
  accessible?: boolean,
  focusable: boolean,
  testID?: string,
};

const ViewExampleInnerRow = ({
  accessible,
  focusable,
  testID,
}: ViewExampleInnerRowProps) => {
  const [focused, setFocused] = useState(false);
  return (
    <View
      accessible={accessible}
      focusable={focusable}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.viewInnerRow]}
      testID={testID}>
      <RNTesterText style={styles.viewInnerRowTextColor}>
        Focusable: {focusable ? 'true' : 'false'}
        {accessible === true ? ', accessible: true' : ''}
      </RNTesterText>
      <RNTesterText style={styles.viewInnerRowTextColor}>
        Focused: {focused ? 'true' : 'false'}
      </RNTesterText>
    </View>
  );
};

const ViewExample = () => {
  return (
    <FocusEventSection>
      <ViewExampleInnerRow focusable={true} />
      <ViewExampleInnerRow focusable={true} />
      <ViewExampleInnerRow focusable={false} />
      <ViewExampleInnerRow focusable={true} />
    </FocusEventSection>
  );
};

const KeyboardFocusExclusionExample = () => {
  return (
    <>
      <RNTesterText style={styles.sectionSubtitle}>
        Tap a text input, then press Tab: focus passes over the accessible view
        with focusable=false.
      </RNTesterText>
      <TextInput
        placeholder="In a View"
        style={styles.textInput}
        testID="keyboard_focus_view_input"
      />
      <ViewExampleInnerRow
        accessible={true}
        focusable={false}
        testID="keyboard_focus_view_excluded"
      />
      <ViewExampleInnerRow focusable={true} testID="keyboard_focus_view_next" />
      <ScrollView style={styles.scrollView}>
        <TextInput
          placeholder="In a ScrollView"
          style={styles.textInput}
          testID="keyboard_focus_scroll_input"
        />
        <ViewExampleInnerRow
          accessible={true}
          focusable={false}
          testID="keyboard_focus_scroll_excluded"
        />
        <ViewExampleInnerRow
          focusable={true}
          testID="keyboard_focus_scroll_next"
        />
      </ScrollView>
    </>
  );
};

const PressableExample = () => {
  const [pressableFocused, setPressableFocused] = useState(false);
  const [disabledPressableFocused, setDisabledPressableFocused] =
    useState(false);

  return (
    <FocusEventSection>
      <Pressable
        onPress={() => Alert.alert('Pressable pressed!')}
        onFocus={() => setPressableFocused(true)}
        onBlur={() => setPressableFocused(false)}>
        <RNTesterText>
          Pressable focused: {pressableFocused ? 'true' : 'false'}
        </RNTesterText>
      </Pressable>
      <Pressable
        disabled={true}
        onPress={() => Alert.alert('Disabled Pressable pressed!')}
        onFocus={() => setDisabledPressableFocused(true)}
        onBlur={() => setDisabledPressableFocused(false)}>
        <RNTesterText>
          Disabled Pressable focused:{' '}
          {disabledPressableFocused ? 'true' : 'false'}
        </RNTesterText>
      </Pressable>
    </FocusEventSection>
  );
};

const TextInputExample = () => {
  const [input1Focused, setInput1Focused] = useState(false);
  const [input2Focused, setInput2Focused] = useState(false);
  const [input3Focused, setInput3Focused] = useState(false);

  return (
    <FocusEventSection>
      <TextInput
        onFocus={() => setInput1Focused(true)}
        onBlur={() => setInput1Focused(false)}
        style={[styles.textInput, input1Focused && styles.textInputFocused]}
        placeholder={`Focused: ${input1Focused ? 'true' : 'false'}`}
      />
      <TextInput
        onFocus={() => setInput2Focused(true)}
        onBlur={() => setInput2Focused(false)}
        style={[styles.textInput, input2Focused && styles.textInputFocused]}
        placeholder={`Focused: ${input2Focused ? 'true' : 'false'}`}
      />
      <TextInput
        onFocus={() => setInput3Focused(true)}
        onBlur={() => setInput3Focused(false)}
        style={[styles.textInput, input3Focused && styles.textInputFocused]}
        placeholder={`Not editable focused: ${input3Focused ? 'true' : 'false'}`}
        editable={false}
      />
    </FocusEventSection>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    rowGap: 16,
  },
  scrollView: {
    height: 180,
    marginTop: 4,
  },
  sectionSubtitle: {
    paddingBottom: 8,
  },
  sectionTitle: {
    paddingBottom: 2,
    fontSize: 20,
  },
  sectionWrapperFocused: {
    borderColor: 'blue',
  },
  textFocused: {
    backgroundColor: 'lightblue',
  },
  textLink: {color: 'blue'},
  textInput: {
    borderColor: 'rgba(40, 40, 40, 0.3)',
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 4,
  },
  textInputFocused: {
    borderColor: 'blue',
  },
  viewInnerRow: {
    backgroundColor: '#424B54',
    borderRadius: 8,
    borderColor: 'transparent',
    borderWidth: 2,
    height: 50,
    marginTop: 4,
    padding: 4,
    width: '100%',
  },
  viewInnerRowTextColor: {
    color: 'white',
  },
});

export default {
  title: 'Focus Events',
  description: 'Examples that show how Focus events can be used.',
  examples: [
    {
      title: 'View Example',
      render: function (): React.Node {
        return <ViewExample />;
      },
    },
    {
      title: 'Keyboard Focus Exclusion Example',
      name: 'keyboard-focus-exclusion',
      render: function (): React.Node {
        return <KeyboardFocusExclusionExample />;
      },
    },
    {
      title: 'TextInput Example',
      render: function (): React.Node {
        return <TextInputExample />;
      },
    },
    {
      title: 'Pressable Example',
      render: function (): React.Node {
        return <PressableExample />;
      },
    },
  ] as Array<RNTesterModuleExample>,
};
