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

import * as React from 'react';
import {useState} from 'react';
import {
  Alert,
  Button,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
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

const CloseButton = (props: {setModalOpen: boolean => void}) => {
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

const BEHAVIOR_DESCRIPTIONS: {[KeyboardAvoidingBehavior]: string} = {
  padding: 'Sets bottom padding equal to the keyboard overlap.',
  position: 'Offsets the content container up by the keyboard overlap.',
  height: 'Shrinks the view height by the keyboard overlap.',
};

const BehaviorPicker = (props: {
  behavior: KeyboardAvoidingBehavior,
  setBehavior: KeyboardAvoidingBehavior => void,
}) => {
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
        }}>
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
  return (
    <View style={styles.outerContainer}>
      <Modal animationType="fade" visible={modalOpen}>
        <KeyboardAvoidingView behavior={behavior} style={styles.container}>
          <BehaviorPicker behavior={behavior} setBehavior={setBehavior} />
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
] as Array<RNTesterModuleExample>;
