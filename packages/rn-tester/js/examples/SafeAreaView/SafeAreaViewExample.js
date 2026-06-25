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
import {useState} from 'react';
import {Button, DeviceInfo, Modal, StyleSheet, View} from 'react-native';

function SafeAreaViewExample(): React.Node {
  const {SafeAreaView} = require('react-native');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const toggleModal = (visible: boolean) => {
    setModalVisible(visible);
  };

  return (
    <View>
      <Modal
        visible={modalVisible}
        onRequestClose={() => toggleModal(false)}
        animationType="slide"
        supportedOrientations={['portrait', 'landscape']}>
        <View style={styles.modal}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.safeAreaContent}>
              <Button onPress={() => toggleModal(false)} title="Close" />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
      <Button
        onPress={() => toggleModal(true)}
        title="Present Modal Screen with SafeAreaView"
      />
    </View>
  );
}

function IsIPhoneXExample(): React.Node {
  return (
    <View>
      <RNTesterText>
        Is this an iPhone X:{' '}
        {DeviceInfo.getConstants()?.isIPhoneX_deprecated === true
          ? 'Yeah!'
          : 'Nope. (Or `isIPhoneX_deprecated` was already removed.)'}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    height: 1000,
  },
  safeAreaContent: {
    flex: 1,
    backgroundColor: '#ffaaaa',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

exports.displayName = undefined as ?string;
exports.framework = 'React';
exports.title = 'SafeAreaView';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/safeareaview';
exports.description =
  'SafeAreaView automatically applies paddings reflect the portion of the view that is not covered by other (special) ancestor views.';
exports.examples = [
  {
    title: '<SafeAreaView> Example',
    description:
      'SafeAreaView automatically applies paddings reflect the portion of the view that is not covered by other (special) ancestor views.',
    render: (): React.Node => <SafeAreaViewExample />,
  },
  {
    title: 'isIPhoneX_deprecated Example',
    description:
      ('`DeviceInfo.isIPhoneX_deprecated` returns true only on iPhone X. ' +
        'Note: This prop is deprecated and will be removed in a future ' +
        'release. Please use this only for a quick and temporary solution. ' +
        'Use <SafeAreaView> instead.') as string,
    render: (): React.Node => <IsIPhoneXExample />,
  },
] as Array<RNTesterModuleExample>;
