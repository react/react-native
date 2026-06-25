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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useState} from 'react';
import {Button, Share, StyleSheet, View} from 'react-native';

const shareMessage = () => {
  // $FlowFixMe[unused-promise]
  Share.share({
    message:
      ('Our top priority for React Native is to match the expectations people have for each platform. This is why React Native renders to platform primitives. We value native look-and-feel over cross-platform consistency.' +
        'For example, the TextInput in React Native renders to a UITextField on iOS. This ensures that integration with password managers and keyboard controls work out of the box. By using platform primitives, React Native apps are also able to stay up-to-date with design and behavior changes from new releases of Android and iOS.') as string,
  });
};

const shareText = () => {
  // $FlowFixMe[unused-promise]
  Share.share(
    {
      title: 'Massive Scale',
      message:
        ('Hundreds of screens in the Facebook app are implemented with React Native. The Facebook app is used by billions of people on a huge range of devices. This is why we invest in the most challenging problems at scale.' +
          'Deploying React Native in our apps lets us identify problems that we wouldn’t see at a smaller scale. For example, Facebook focuses on improving performance across a broad spectrum of devices from the newest iPhone to many older generations of Android devices. This focus informs our architecture projects such as Hermes, Fabric, and TurboModules.') as string,
      url: 'https://reactnative.dev/blog/2020/07/17/react-native-principles',
    },
    {
      subject: 'MUST READ: Massive Scale',
      dialogTitle: 'Share React Native Blog',
      excludedActivityTypes: ['com.apple.UIKit.activity.PostToTwitter'],
      tintColor: 'blue',
    },
  );
};

const ShareMessageWithoutTitle = () => {
  return (
    <View style={styles.container}>
      <RNTesterText style={styles.title}>Native Experience</RNTesterText>
      <RNTesterText>
        Our top priority for React Native is to match the expectations people
        have for each platform. This is why React Native renders to platform
        primitives. We value native look-and-feel over cross-platform
        consistency. For example, the TextInput in React Native renders to a
        UITextField on iOS. This ensures that integration with password managers
        and keyboard controls work out of the box. By using platform primitives,
        React Native apps are also able to stay up-to-date with design and
        behavior changes from new releases of Android and iOS.
      </RNTesterText>
      <Button title="SHARE" onPress={shareMessage} />
    </View>
  );
};

const ShareMessageWithTitle = () => {
  return (
    <View style={styles.container}>
      <RNTesterText style={styles.title}>Massive Scale</RNTesterText>
      <RNTesterText>
        Hundreds of screens in the Facebook app are implemented with React
        Native. The Facebook app is used by billions of people on a huge range
        of devices. This is why we invest in the most challenging problems at
        scale. Deploying React Native in our apps lets us identify problems that
        we wouldn’t see at a smaller scale. For example, Facebook focuses on
        improving performance across a broad spectrum of devices from the newest
        iPhone to many older generations of Android devices. This focus informs
        our architecture projects such as Hermes, Fabric, and TurboModules.
      </RNTesterText>
      <Button title="SHARE" onPress={shareText} />
    </View>
  );
};

const SharedAction = () => {
  const [shared, setShared] = useState<?string>();

  const sharedAction = async () => {
    try {
      const result = await Share.share(
        {
          title: 'Create native apps',
          message:
            'React Native combines the best parts of native development with React, a best-in-class JavaScript library for building user interfaces.' as string,
          url: 'https://reactnative.dev/',
        },
        {
          subject: 'MUST READ: Create native apps with React Native',
          dialogTitle: 'Share React Native Home Page',
          tintColor: 'blue',
        },
      );
      if (result.action === Share.sharedAction) {
        setShared(result.action);
      } else if (result.action === Share.dismissedAction) {
        //iOS only, if dialog was dismissed
        setShared(null);
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <View style={styles.container}>
      <RNTesterText>action: {shared ? shared : 'null'}</RNTesterText>
      <RNTesterText style={styles.title}>Create native apps</RNTesterText>
      <RNTesterText>
        React Native combines the best parts of native development with React, a
        best-in-class JavaScript library for building user interfaces.
      </RNTesterText>
      <Button title="SHARE" onPress={sharedAction} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    margin: 10,
    textAlign: 'center',
  },
});

exports.title = 'Share';
exports.description = 'Share data with other Apps.';
exports.examples = [
  {
    title: 'Share message',
    render(): React.Node {
      return <ShareMessageWithoutTitle />;
    },
  },
  {
    title: 'Share message, URL (iOS) and title (Android)',
    render(): React.Node {
      return <ShareMessageWithTitle />;
    },
  },
  {
    title: 'sharedAction: If the content was successfully shared',
    render(): React.Node {
      return <SharedAction />;
    },
  },
] as Array<RNTesterModuleExample>;
