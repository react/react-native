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
import type {SafeAreaInsets} from 'react-native';

import * as React from 'react';
import {useState} from 'react';
import {
  Alert,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const onButtonPress = () => {
  Alert.alert('Successfully Registered!');
};

const TextInputForm = () => {
  return (
    <View>
      <TextInput placeholder="Email" style={styles.textInput} />
      <TextInput placeholder="Username" style={styles.textInput} />
      <TextInput placeholder="Password" style={styles.textInput} />
      <TextInput placeholder="Confirm Password" style={styles.textInput} />
      <Button
        testID="register_button"
        title="Register"
        onPress={onButtonPress}
      />
    </View>
  );
};

const CloseButton = (props: {setModalOpen: (v: boolean) => void}) => {
  return (
    <Pressable
      onPress={() => props.setModalOpen(false)}
      style={styles.closeButton}>
      <Text style={styles.touchableText}>Close</Text>
    </Pressable>
  );
};

type KeyboardAvoidingBehavior = 'padding' | 'position' | 'height';

const BEHAVIORS: Array<KeyboardAvoidingBehavior> = [
  'padding',
  'position',
  'height',
];

const BEHAVIOR_DESCRIPTIONS: {[key: KeyboardAvoidingBehavior]: string} = {
  padding: 'Sets bottom padding equal to the keyboard overlap.',
  position: 'Offsets the content container up by the keyboard overlap.',
  height: 'Shrinks the view height by the keyboard overlap.',
};

const NativeToggle = (props: {
  native: boolean,
  setNative: (value: boolean) => void,
}) => {
  return (
    <View style={styles.nativeToggle}>
      <Text>experimental_native</Text>
      <Switch
        testID="keyboard_avoiding_view_native_toggle"
        value={props.native}
        onValueChange={props.setNative}
      />
    </View>
  );
};

const BehaviorPicker = (props: {
  behavior: KeyboardAvoidingBehavior,
  setBehavior: (v: KeyboardAvoidingBehavior) => void,
}) => {
  return (
    <View>
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        {BEHAVIORS.map(behavior => {
          const selected = props.behavior === behavior;
          return (
            <TouchableOpacity
              key={behavior}
              onPress={() => props.setBehavior(behavior)}
              style={[
                styles.pillStyle,
                {backgroundColor: selected ? 'blue' : 'white'},
              ]}>
              <Text
                style={{
                  textTransform: 'capitalize',
                  color: selected ? 'white' : 'blue',
                }}>
                {behavior}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.behaviorDescription}>
        {BEHAVIOR_DESCRIPTIONS[props.behavior]}
      </Text>
    </View>
  );
};

const KeyboardAvoidingViewBehaviour = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [behavior, setBehavior] = useState<KeyboardAvoidingBehavior>('padding');
  const [native, setNative] = useState(false);
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          behavior={behavior}
          experimental_native={native}
          style={styles.container}>
          <BehaviorPicker behavior={behavior} setBehavior={setBehavior} />
          <NativeToggle native={native} setNative={setNative} />
          <CloseButton setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable onPress={() => setModalOpen(true)}>
          <Text
            style={styles.touchableText}
            testID="keyboard_avoiding_view_behaviors_open">
            Open Example
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingDisabled = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          enabled={false}
          behavior={'height'}
          style={styles.container}>
          <CloseButton setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable onPress={() => setModalOpen(true)}>
          <Text style={styles.touchableText}>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingVerticalOffset = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={20}
          behavior={'padding'}
          style={styles.container}>
          <CloseButton setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable onPress={() => setModalOpen(true)}>
          <Text style={styles.touchableText}>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingContentContainerStyle = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <View>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          keyboardVerticalOffset={20}
          behavior={'position'}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}>
          <CloseButton setModalOpen={setModalOpen} />
          <TextInputForm />
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable onPress={() => setModalOpen(true)}>
          <Text style={styles.touchableText}>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

const KeyboardAvoidingScrollView = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [behavior, setBehavior] = useState<KeyboardAvoidingBehavior>('padding');
  return (
    <View>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView
          behavior={behavior}
          style={styles.scrollViewContainer}
          contentContainerStyle={{flex: 1}}>
          <View style={{paddingHorizontal: 20}}>
            <BehaviorPicker behavior={behavior} setBehavior={setBehavior} />
            <CloseButton setModalOpen={setModalOpen} />
          </View>
          <ScrollView
            style={{flex: 1}}
            contentContainerStyle={styles.scrollViewContent}>
            {Array.from({length: 10}, (_, index) => (
              <View key={index} style={styles.fillerItem}>
                <Text style={{fontSize: 16}}>Item {index + 1}</Text>
              </View>
            ))}
            <TextInput placeholder="Name" style={styles.textInput} />
            <TextInput
              placeholder="Message"
              multiline
              style={[styles.textInput, styles.multilineTextInput]}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <View>
        <Pressable onPress={() => setModalOpen(true)}>
          <Text style={styles.touchableText}>Open Example</Text>
        </Pressable>
      </View>
    </View>
  );
};

type ChatMessage = {
  id: string,
  text: string,
  isSent: boolean,
};

const CHAT_LINES = [
  'Hey! Are we still on for tonight?',
  'Yes, 8pm works for me.',
  'Great. Same place as last time?',
  'Sure. Should I book a table?',
  'Please do, it gets busy on Fridays.',
  'Done, table for four.',
  'Who else is coming?',
  'Sam and Alex.',
];

const INITIAL_CHAT_MESSAGES: Array<ChatMessage> = Array.from(
  {length: 40},
  (_, index) => ({
    id: String(index),
    text: CHAT_LINES[index % CHAT_LINES.length],
    isSent: index % 3 === 0,
  }),
);

const ChatBubble = ({message}: {message: ChatMessage}) => {
  return (
    <View
      style={[
        styles.chatBubble,
        message.isSent ? styles.chatBubbleSent : styles.chatBubbleReceived,
      ]}>
      <Text style={message.isSent ? styles.chatBubbleSentText : null}>
        {message.text}
      </Text>
    </View>
  );
};

const KeyboardAvoidingChat = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [native, setNative] = useState(true);
  const [messages, setMessages] = useState(INITIAL_CHAT_MESSAGES);
  const [draft, setDraft] = useState('');
  const [insets, setInsets] = useState<SafeAreaInsets | null>(null);
  const [keyboardVerticalOffset, setKeyboardVerticalOffset] = useState(0);

  const sendMessage = () => {
    const text = draft.trim();

    if (text === '') {
      return;
    }

    setMessages(prevMessages => [
      {id: String(Date.now()), text, isSent: true},
      ...prevMessages,
    ]);

    setDraft('');
  };

  return (
    <View>
      <Modal animationType="fade" visible={modalOpen}>
        <View
          experimental_onSafeAreaInsetsChange={event => {
            setInsets(event.nativeEvent.insets);
          }}
          style={[
            styles.chatContainer,
            insets != null && {
              paddingBottom: insets.bottom,
              paddingLeft: insets.left,
              paddingRight: insets.right,
              paddingTop: insets.top,
            },
          ]}>
          <View style={styles.chatHeader}>
            <NativeToggle native={native} setNative={setNative} />
            <CloseButton setModalOpen={setModalOpen} />
          </View>

          <View
            onLayout={event => {
              setKeyboardVerticalOffset(event.nativeEvent.layout.y);
            }}
            style={styles.chatClip}>
            <KeyboardAvoidingView
              behavior="translate-with-padding"
              experimental_native={native}
              keyboardVerticalOffset={keyboardVerticalOffset}
              style={styles.chatKeyboardAvoidingView}>
              <FlatList
                data={messages}
                inverted
                keyboardDismissMode="interactive"
                keyExtractor={item => item.id}
                renderItem={({item}) => <ChatBubble message={item} />}
                contentContainerStyle={styles.chatListContent}
              />

              <View style={styles.chatComposer}>
                <TextInput
                  testID="keyboard_avoiding_view_chat_input"
                  placeholder="Message"
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={sendMessage}
                  submitBehavior="submit"
                  style={styles.chatInput}
                />

                <Button
                  testID="keyboard_avoiding_view_chat_send"
                  title="Send"
                  onPress={sendMessage}
                />
              </View>
            </KeyboardAvoidingView>
          </View>
        </View>
      </Modal>

      <View>
        <Pressable onPress={() => setModalOpen(true)}>
          <Text
            style={styles.touchableText}
            testID="keyboard_avoiding_view_chat_open">
            Open Example
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    width: '100%',
    maxWidth: 340,
  },
  contentContainer: {
    paddingTop: 20,
    backgroundColor: '#abdebf',
  },
  scrollViewContainer: {
    flex: 1,
    paddingTop: 100,
  },
  scrollViewContent: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  fillerItem: {
    backgroundColor: '#eeeeee',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  textInput: {
    borderRadius: 5,
    borderWidth: 1,
    minHeight: 44,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  multilineTextInput: {
    minHeight: 88,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  pillStyle: {
    padding: 10,
    marginHorizontal: 5,
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'blue',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginVertical: 10,
    padding: 10,
  },
  touchableText: {
    fontWeight: '500',
    color: 'blue',
  },
  nativeToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  chatHeader: {
    alignItems: 'center',
    borderBottomColor: '#dddddd',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  chatClip: {
    flex: 1,
    overflow: 'hidden',
  },
  chatKeyboardAvoidingView: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatBubble: {
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatBubbleSent: {
    alignSelf: 'flex-end',
    backgroundColor: 'blue',
  },
  chatBubbleSentText: {
    color: 'white',
  },
  chatBubbleReceived: {
    alignSelf: 'flex-start',
    backgroundColor: '#eeeeee',
  },
  chatComposer: {
    alignItems: 'center',
    borderTopColor: '#dddddd',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chatInput: {
    borderColor: '#dddddd',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    minHeight: 40,
    paddingHorizontal: 12,
  },
  behaviorDescription: {
    textAlign: 'center',
    alignSelf: 'center',
    width: 200,
  },
});

exports.title = 'KeyboardAvoidingView';
exports.description =
  'Base component for views that automatically adjust their height or position to move out of the way of the keyboard.';
exports.examples = [
  {
    title: 'Keyboard Avoiding View with different behaviors',
    description:
      ('Specify how to react to the presence of the keyboard. Android and iOS both interact ' +
        'with this prop differently. On both iOS and Android, setting behavior is recommended.') as string,
    render(): React.Node {
      return <KeyboardAvoidingViewBehaviour />;
    },
  },
  {
    title: 'Keyboard Avoiding View with keyboardVerticalOffset={distance}',
    description:
      ('This is the distance between the top of the user screen and the React Native ' +
        'view, may be non-zero in some use cases. Defaults to 0.') as string,
    render(): React.Node {
      return <KeyboardAvoidingVerticalOffset />;
    },
  },
  {
    title: 'Keyboard Avoiding View with enabled={false}',
    description: 'Disable the KeyboardAvoidingView.' as string,
    render(): React.Node {
      return <KeyboardAvoidingDisabled />;
    },
  },
  {
    title: 'Keyboard Avoiding View with contentContainerStyle',
    description:
      'Specify the style of the content container View when behavior is set to position.' as string,
    render(): React.Node {
      return <KeyboardAvoidingContentContainerStyle />;
    },
  },
  {
    title: 'Keyboard Avoiding View with ScrollView',
    description:
      ('A ScrollView with filler content and TextInputs at the bottom inside the scrollable content. ' +
        'TextInputs should still be visible when focused.') as string,
    render(): React.Node {
      return <KeyboardAvoidingScrollView />;
    },
  },
  {
    title: 'Keyboard Avoiding View with a chat',
    description:
      ('An inverted message list and a composer with behavior="translate-with-padding". ' +
        'The view moves up with the keyboard, and lays out once when the keyboard settles.') as string,
    render(): React.Node {
      return <KeyboardAvoidingChat />;
    },
  },
] as Array<RNTesterModuleExample>;
