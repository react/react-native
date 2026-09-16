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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useCallback, useState} from 'react';
import {Button, StyleSheet, View} from 'react-native';
import PushNotificationIOS from 'react-native/Libraries/PushNotificationIOS/PushNotificationIOS';

// Fires setApplicationIconBadgeNumber many times back-to-back.
const RAPID_FIRE_COUNT = 50;

function BadgeExample(): React.Node {
  const [reported, setReported] = useState<?number>(null);

  const updateBadge = useCallback((n: number) => {
    PushNotificationIOS.setApplicationIconBadgeNumber(n);
  }, []);

  const readBadge = useCallback(() => {
    PushNotificationIOS.getApplicationIconBadgeNumber((n: number) => {
      setReported(n);
    });
  }, []);

  const rapidFire = useCallback(() => {
    for (let i = 1; i <= RAPID_FIRE_COUNT; i++) {
      PushNotificationIOS.setApplicationIconBadgeNumber(i);
    }
  }, []);

  return (
    <View style={styles.wrapper}>
      <RNTesterText style={styles.text}>
        {reported == null
          ? 'Tap "Read current badge" to query the badge number.'
          : `Last read badge number: ${reported}`}
      </RNTesterText>
      <View style={styles.button}>
        <Button title="Set badge to 5" onPress={() => updateBadge(5)} />
      </View>
      <View style={styles.button}>
        <Button title="Clear badge (set 0)" onPress={() => updateBadge(0)} />
      </View>
      <View style={styles.button}>
        <Button
          title={`Rapid-fire ${RAPID_FIRE_COUNT}x set`}
          onPress={rapidFire}
        />
      </View>
      <View style={styles.button}>
        <Button title="Read current badge" onPress={readBadge} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 10,
  },
  text: {
    marginBottom: 10,
  },
  button: {
    marginVertical: 4,
  },
});

exports.framework = 'React';
exports.title = 'PushNotificationIOS';
exports.category = 'iOS';
exports.documentationURL = 'https://reactnative.dev/docs/pushnotificationios';
exports.description = 'Application icon badge number via UserNotifications.';

exports.examples = [
  {
    title: 'Application icon badge number',
    description:
      'Set/clear/read the app icon badge. "Rapid-fire" stresses the setter ' +
      'to confirm the main thread never blocks on the UserNotifications XPC ' +
      'round-trip.',
    render(): React.Node {
      return <BadgeExample />;
    },
  },
] as Array<RNTesterModuleExample>;
