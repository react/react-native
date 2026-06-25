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

import RNTesterBlock from '../../components/RNTesterBlock';
import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {
  Button,
  Linking,
  Platform,
  StyleSheet,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

class OpenURLButton extends React.Component<
  Readonly<{
    url: string,
  }>,
> {
  handleClick = async () => {
    const supported = await Linking.canOpenURL(this.props.url);
    if (supported) {
      void Linking.openURL(this.props.url);
    } else {
      console.log(
        `Don't know how to open URI: ${
          this.props.url
        }, ensure you have an app installed that handles the "${
          this.props.url.split(':')?.[0]
        }" scheme`,
      );
    }
  };

  render(): React.Node {
    return (
      <TouchableOpacity onPress={this.handleClick}>
        <View style={styles.button}>
          <RNTesterText style={styles.text}>Open {this.props.url}</RNTesterText>
        </View>
      </TouchableOpacity>
    );
  }
}

class OpenSettingsExample extends React.Component<Readonly<{}>> {
  openSettings = () => {
    void Linking.openSettings();
  };

  render(): React.Node {
    return <Button onPress={this.openSettings} title={'Open Settings'} />;
  }
}

const SendIntentButton = ({
  action,
  extras,
}: Readonly<{
  action: string,
  extras?: Array<{
    key: string,
    value: string | number | boolean,
    ...
  }>,
}>) => {
  const [isOpeningIntent, setIsOpeningIntent] = useState(false);

  const handleIntent = async () => {
    setIsOpeningIntent(true);
    try {
      await Linking.sendIntent(action, extras);
    } catch (e) {
      ToastAndroid.show(e.message, ToastAndroid.LONG);
    } finally {
      setIsOpeningIntent(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleIntent}>
      <View style={[styles.button, styles.buttonIntent]}>
        <RNTesterText style={styles.text}>
          {isOpeningIntent ? `Opening ${action}...` : action}
        </RNTesterText>
      </View>
    </TouchableOpacity>
  );
};

class IntentAndroidExample extends React.Component<Readonly<{}>> {
  render(): React.Node {
    return (
      <View>
        <View>
          <OpenURLButton url={'https://www.facebook.com'} />
          <OpenURLButton url={'http://www.facebook.com'} />
          <OpenURLButton url={'http://facebook.com'} />
          <OpenURLButton url={'fb://notifications'} />
          <OpenURLButton url={'geo:37.484847,-122.148386'} />
          <OpenURLButton url={'tel:9876543210'} />
        </View>
        {Platform.OS === 'android' ? (
          <RNTesterBlock title="Send intents">
            <SendIntentButton action="android.intent.action.POWER_USAGE_SUMMARY" />
            <RNTesterText style={styles.textSeparator}>
              Next one will throw an exception if Facebook app is not installed.
            </RNTesterText>
            <SendIntentButton
              action="android.settings.APP_NOTIFICATION_SETTINGS"
              extras={[
                {
                  key: 'android.provider.extra.APP_PACKAGE',
                  value: 'com.facebook.katana',
                },
              ]}
            />
          </RNTesterBlock>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  button: {
    padding: 10,
    backgroundColor: '#3B5998',
    marginBottom: 10,
  },
  buttonIntent: {
    backgroundColor: '#009688',
  },
  text: {
    color: 'white',
  },
  textSeparator: {
    paddingBottom: 8,
  },
});

exports.title = 'Linking';
exports.category = 'Basic';
exports.documentationURL = 'https://reactnative.dev/docs/linking';
exports.description = 'Shows how to use Linking to open URLs.';
exports.examples = [
  {
    title: 'Open external URLs',
    description:
      'Custom schemes may require specific apps to be installed on the device. Note: Phone app is not supported in the simulator.',
    render(): React.MixedElement {
      return <IntentAndroidExample />;
    },
  },
  {
    title: 'Open settings app',
    render(): React.MixedElement {
      return <OpenSettingsExample />;
    },
  },
] as Array<RNTesterModuleExample>;
