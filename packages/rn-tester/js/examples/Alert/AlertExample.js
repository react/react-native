/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModule} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {Alert, Pressable, StyleSheet, Text, View} from 'react-native';

// Shows log on the screen
const Log = ({message}: {message: string}) =>
  message ? (
    <View style={styles.logContainer}>
      <RNTesterText>
        <RNTesterText style={styles.bold}>Log</RNTesterText>: {message}
      </RNTesterText>
    </View>
  ) : null;

/**
 * Simple alert examples.
 */

const AlertWithDefaultButton = () => {
  const alertMessage = 'An external USB drive has been detected!';

  return (
    <View>
      <Pressable
        testID="alert-with-default-button"
        style={styles.wrapper}
        onPress={() => Alert.alert('Alert', alertMessage)}>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
    </View>
  );
};

const AlertWithTwoButtons = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Your subscription has expired!';

  return (
    <View>
      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Action Required!', alertMessage, [
            {text: 'Ignore', onPress: () => setMessage('Ignore Pressed!')},
            {text: 'Renew', onPress: () => setMessage('Renew Pressed!')},
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
      <Log message={message} />
    </View>
  );
};

const AlertWithThreeButtons = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Do you want to save your changes?';

  return (
    <View>
      <Pressable
        testID="alert-with-three-buttons"
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Unsaved Changes!', alertMessage, [
            {text: 'Cancel', onPress: () => setMessage('Cancel Pressed!')},
            {text: 'No', onPress: () => setMessage('No Pressed!')},
            {text: 'Yes', onPress: () => setMessage('Yes Pressed!')},
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
      <Log message={message} />
    </View>
  );
};

const AlertWithManyButtons = () => {
  const [message, setMessage] = useState('');

  const alertMessage =
    'Credibly reintermediate next-generation potentialities after goal-oriented ' +
    'catalysts for change. Dynamically revolutionize.';

  return (
    <View>
      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.alert(
            'Foo Title',
            alertMessage,
            '..............'.split('').map((dot, index) => ({
              text: 'Button ' + index,
              onPress: () => setMessage(`Button ${index} Pressed!`),
            })),
          )
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
      <Log message={message} />
    </View>
  );
};

const AlertWithCancelableTrue = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Tapping outside this dialog will dismiss this alert.';

  return (
    <View>
      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.alert(
            'Alert Title',
            alertMessage,
            [{text: 'OK', onPress: () => setMessage('OK Pressed!')}],
            {
              cancelable: true,
              onDismiss: () =>
                setMessage(
                  'This alert was dismissed by tapping outside of the alert dialog.',
                ),
            },
          )
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
      <Log message={message} />
    </View>
  );
};

const AlertWithStyles = () => {
  const [message, setMessage] = useState('');

  const alertMessage = 'Look at the button styles!';

  return (
    <View>
      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Styled Buttons!', alertMessage, [
            {
              text: 'Default',
              onPress: () => setMessage('Default Pressed!'),
              style: 'default',
            },
            {
              text: 'Cancel',
              onPress: () => setMessage('Cancel Pressed!'),
              style: 'cancel',
            },
            {
              text: 'Destructive',
              onPress: () => setMessage('Destructive Pressed!'),
              style: 'destructive',
            },
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
      <Log message={message} />
    </View>
  );
};

const AlertWithStylesPreferred = () => {
  const [message, setMessage] = useState('');

  const alertMessage =
    "The Preferred button is styled with 'preferred', so it is emphasized over the cancel button.";

  return (
    <View>
      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.alert('Foo Title', alertMessage, [
            {
              text: 'Preferred',
              isPreferred: true,
              onPress: () => setMessage('Preferred Pressed!'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setMessage('Cancel Pressed!'),
            },
          ])
        }>
        <View style={styles.button}>
          <Text>Tap to view alert</Text>
        </View>
      </Pressable>
      <Log message={message} />
    </View>
  );
};

const PromptOptions = () => {
  const [promptValue, setPromptValue] = useState<
    string | {login: string, password: string},
  >('');

  const customButtons = [
    {
      text: 'Custom OK',
      onPress: setPromptValue,
    },
    {
      text: 'Custom Cancel',
      style: 'cancel',
    },
  ];

  return (
    <View>
      <RNTesterText style={styles.promptValue}>
        <Text style={styles.bold}>Prompt value:</Text>
        {JSON.stringify(promptValue, null, 2)}
      </RNTesterText>

      <Pressable
        style={styles.wrapper}
        onPress={() => Alert.prompt('Type a value', null, setPromptValue)}>
        <View style={styles.button}>
          <Text>prompt with title & callback</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.wrapper}
        /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
         * https://fburl.com/workplace/6291gfvu */
        onPress={() => Alert.prompt('Type a value', null, customButtons)}>
        <View style={styles.button}>
          <Text>prompt with title & custom buttons</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.prompt(
            'Type a phone number',
            null,
            null,
            'plain-text',
            undefined,
            'phone-pad',
          )
        }>
        <View style={styles.button}>
          <Text>prompt with title & custom keyboard</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.prompt(
            'Type a value',
            null,
            setPromptValue,
            undefined,
            'Default value',
          )
        }>
        <View style={styles.button}>
          <Text>prompt with title, callback & default value</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.prompt(
            'Type a value',
            null,
            /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
             * https://fburl.com/workplace/6291gfvu */
            customButtons,
            'login-password',
            'admin@site.com',
          )
        }>
        <View style={styles.button}>
          <Text>
            prompt with title, custom buttons, login/password & default value
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

const PromptTypes = () => {
  return (
    <View>
      <Pressable
        style={styles.wrapper}
        onPress={() => Alert.prompt('Plain Text Entry')}>
        <View style={styles.button}>
          <Text>plain-text</Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.wrapper}
        onPress={() => Alert.prompt('Secure Text', null, null, 'secure-text')}>
        <View style={styles.button}>
          <Text>secure-text</Text>
        </View>
      </Pressable>
      <Pressable
        style={styles.wrapper}
        onPress={() =>
          Alert.prompt('Login & Password', null, null, 'login-password')
        }>
        <View style={styles.button}>
          <Text>login-password</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 5,
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#eeeeee',
    padding: 10,
  },
  logContainer: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  promptValue: {
    marginBottom: 10,
  },
});

export const examples = [
  {
    title: 'Alert with default Button',
    name: 'default-button',
    description:
      "It can be used to show some information to user that doesn't require an action.",
    render(): React.Node {
      return <AlertWithDefaultButton />;
    },
  },
  {
    title: 'Alert with two Buttons',
    description: 'It can be used when an action is required from the user.',
    render(): React.Node {
      return <AlertWithTwoButtons />;
    },
  },
  {
    title: 'Alert with three Buttons',
    name: 'three-buttons',
    description: 'It can be used when there are three possible actions',
    render(): React.Node {
      return <AlertWithThreeButtons />;
    },
  },
  {
    title: 'Alert with many Buttons',
    platform: 'ios',
    description: 'It can be used when more than three actions are required.',
    render(): React.Node {
      return <AlertWithManyButtons />;
    },
  },
  {
    title: 'Alert with cancelable={true}',
    platform: 'android',
    description:
      'By passing cancelable={false} prop to alerts on Android, they can be dismissed by tapping outside of the alert box.',
    render(): React.Node {
      return <AlertWithCancelableTrue />;
    },
  },
  {
    title: 'Alert with styles',
    platform: 'ios',
    description:
      "Alert buttons can be styled. There are three button styles - 'default' | 'cancel' | 'destructive'.",
    render(): React.Node {
      return <AlertWithStyles />;
    },
  },
  {
    title: 'Alert with styles + preferred',
    platform: 'ios',
    description:
      "Alert buttons with 'isPreferred' will be emphasized, even over cancel buttons",
    render(): React.Node {
      return <AlertWithStylesPreferred />;
    },
  },
  {
    title: 'Prompt Options',
    platform: 'ios',
    render(): React.Node {
      return <PromptOptions />;
    },
  },
  {
    title: 'Prompt Types',
    platform: 'ios',
    render(): React.Node {
      return <PromptTypes />;
    },
  },
];

export default {
  framework: 'React',
  title: 'Alerts',
  category: 'UI',
  documentationURL: 'https://reactnative.dev/docs/alert',
  description:
    'Alerts display a concise and informative message and prompt the user to make a decision.',
  /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
   * https://fburl.com/workplace/6291gfvu */
  examples,
} as RNTesterModule;
