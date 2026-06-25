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

import * as React from 'react';
import {useState} from 'react';
import {
  Button,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

component ScrollViewIndicatorInsetsExample() {
  const [
    automaticallyAdjustsScrollIndicatorInsets,
    setAutomaticallyAdjustsScrollIndicatorInsets,
  ] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const {height, width} = useWindowDimensions();

  return (
    <View>
      <Modal
        animationType="slide"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        presentationStyle="fullScreen"
        statusBarTranslucent={false}
        supportedOrientations={['portrait', 'landscape']}>
        <View style={styles.modal}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollViewContent,
              {
                height: height * 1.2,
                width: width * 1.2,
              },
            ]}
            automaticallyAdjustsScrollIndicatorInsets={
              automaticallyAdjustsScrollIndicatorInsets
            }
            style={styles.scrollView}>
            <View style={styles.description}>
              <Text>
                When{' '}
                <Text style={styles.code}>
                  automaticallyAdjustsScrollIndicatorInsets
                </Text>{' '}
                is true, the scrollbar is inset to the status bar. When false,
                it reaches the edge of the modal.
              </Text>
              <Text>
                Check out the UIScrollView docs to learn more about{' '}
                <Text style={styles.code}>
                  automaticallyAdjustsScrollIndicatorInsets
                </Text>
              </Text>
            </View>
            <View style={styles.toggle}>
              <Text>
                <Text style={styles.code}>
                  automaticallyAdjustsScrollIndicatorInsets
                </Text>{' '}
                is {String(automaticallyAdjustsScrollIndicatorInsets)}
              </Text>
              <Switch
                onValueChange={v =>
                  setAutomaticallyAdjustsScrollIndicatorInsets(v)
                }
                value={automaticallyAdjustsScrollIndicatorInsets}
                style={styles.switch}
              />
            </View>
            <Button onPress={() => setModalVisible(false)} title="Close" />
          </ScrollView>
        </View>
      </Modal>
      <Text />
      <Button
        onPress={() => setModalVisible(true)}
        title="Present Fullscreen Modal with ScrollView"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    height: 1000,
  },
  scrollViewContent: {
    alignItems: 'center',
    backgroundColor: '#ffaaaa',
    justifyContent: 'flex-start',
    paddingTop: 200,
  },
  switch: {
    marginBottom: 40,
  },
  toggle: {
    margin: 20,
    alignItems: 'center',
  },
  description: {
    marginHorizontal: 80,
  },
  code: {
    fontSize: 10,
    fontFamily: 'Courier',
  },
});

exports.title = 'ScrollViewIndicatorInsets';
exports.category = 'iOS';
exports.description =
  'ScrollView automaticallyAdjustsScrollIndicatorInsets adjusts scroll indicator insets using OS-defined logic on iOS 13+.';
exports.examples = [
  {
    title: '<ScrollView> automaticallyAdjustsScrollIndicatorInsets Example',
    render: (): React.Node => <ScrollViewIndicatorInsetsExample />,
  },
] as Array<RNTesterModuleExample>;
