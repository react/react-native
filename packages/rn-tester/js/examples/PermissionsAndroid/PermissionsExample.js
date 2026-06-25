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
import type {Permission} from 'react-native';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterText from '../../components/RNTesterText';
import RNTOption from '../../components/RNTOption';
import * as React from 'react';
import {useState} from 'react';
import {PermissionsAndroid, StyleSheet, View} from 'react-native';

function PermissionsExample() {
  const [permission, setPermission] = useState<Permission>(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  const [hasPermission, setHasPermission] = useState('Not Checked');

  const requestPermission = async () => {
    let result;
    try {
      result = await PermissionsAndroid.request(permission, {
        title: 'Permission Explanation',
        message:
          'The app needs the following permission ' +
          permission +
          ' because of reasons. Please approve.',
      });
      setHasPermission(result + ' for ' + permission);
    } catch (e) {
      throw e;
    }
  };

  const checkPermission = async () => {
    let result;
    try {
      result = await PermissionsAndroid.check(permission);
    } catch (e) {
      throw e;
    }
    setHasPermission(`${result ? 'Granted' : 'Revoked'} for ${permission}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.block}>
        <RNTesterText style={styles.title}>Select Permission</RNTesterText>
        <View style={styles.row}>
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.CAMERA}
            key={PermissionsAndroid.PERMISSIONS.CAMERA}
            onPress={() => setPermission(PermissionsAndroid.PERMISSIONS.CAMERA)}
            selected={permission === PermissionsAndroid.PERMISSIONS.CAMERA}
            style={styles.option}
          />
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.READ_CALENDAR}
            key={PermissionsAndroid.PERMISSIONS.READ_CALENDAR}
            onPress={() =>
              setPermission(PermissionsAndroid.PERMISSIONS.READ_CALENDAR)
            }
            selected={
              permission === PermissionsAndroid.PERMISSIONS.READ_CALENDAR
            }
            style={styles.option}
          />
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION}
            key={PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION}
            onPress={() =>
              setPermission(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
            }
            selected={
              permission === PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            }
            style={styles.option}
          />
          <RNTOption
            label={PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS}
            key={PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS}
            onPress={() =>
              setPermission(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
            }
            selected={
              permission === PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
            }
            style={styles.option}
          />
        </View>
      </View>
      <RNTesterButton onPress={checkPermission}>
        <View>
          <RNTesterText style={[styles.touchable, styles.text]}>
            Check Permission
          </RNTesterText>
        </View>
      </RNTesterButton>
      <RNTesterButton onPress={requestPermission}>
        <View>
          <RNTesterText style={[styles.touchable, styles.text]}>
            Request Permission
          </RNTesterText>
        </View>
      </RNTesterButton>
      <RNTesterText style={styles.text}>
        Permission Status: {hasPermission}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  block: {
    borderColor: 'rgba(0,0,0, 0.1)',
    borderBottomWidth: 1,
    padding: 6,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: 20,
  },
  touchable: {
    color: '#007AFF',
  },
  option: {
    margin: 6,
  },
});

exports.displayName = undefined as ?string;
exports.framework = 'React';
exports.title = 'PermissionsAndroid';
exports.category = 'Android';
exports.description = 'Permissions example for API 23+.';
exports.examples = [
  {
    title: 'Permissions Example',
    description:
      'Short example of how to use the runtime permissions API introduced in Android M.',
    render: (): React.Node => <PermissionsExample />,
  },
] as Array<RNTesterModuleExample>;
