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
import * as React from 'react';
import {useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';

function ModalOnShowOnDismiss(): React.Node {
  const [modalShowComponent, setModalShowComponent] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [onShowCount, setOnShowCount] = useState(0);
  const [onDismissCount, setOnDismissCount] = useState(0);

  return (
    <View style={styles.container}>
      {modalShowComponent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onShow={() => {
            setOnShowCount(showCount => showCount + 1);
          }}
          onDismiss={() => {
            setOnDismissCount(dismissCount => dismissCount + 1);
          }}
          onRequestClose={() => {
            setModalVisible(false);
          }}>
          <View style={[styles.centeredView, styles.modalBackdrop]}>
            <View style={styles.modalView}>
              <Text testID="modal-on-show-count">
                onShow is called {onShowCount} times
              </Text>
              <Text testID="modal-on-dismiss-count">
                onDismiss is called {onDismissCount} times
              </Text>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}>
                <Text testID="dismiss-modal" style={styles.textStyle}>
                  Hide modal by setting visible to false
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalShowComponent(false)}>
                <Text
                  testID="dismiss-modal-by-removing-component"
                  style={styles.textStyle}>
                  Hide modal by removing component
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
      <RNTesterText testID="on-show-count">
        onShow is called {onShowCount} times
      </RNTesterText>
      <RNTesterText testID="on-dismiss-count">
        onDismiss is called {onDismissCount} times
      </RNTesterText>
      <Pressable
        style={[styles.button, styles.buttonOpen]}
        onPress={() => {
          setModalShowComponent(true);
          setModalVisible(true);
        }}>
        <Text testID="open-modal" style={styles.textStyle}>
          Show Modal
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    alignItems: 'center',
    paddingVertical: 30,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    marginVertical: 20,
    elevation: 2,
  },
  buttonOpen: {
    backgroundColor: '#F194FF',
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default {
  title: "Modal's onShow/onDismiss",
  name: 'onShow',
  description:
    'onShow and onDismiss (iOS only) callbacks are called when a modal is shown/dismissed',
  render: (): React.Node => <ModalOnShowOnDismiss />,
} as RNTesterModuleExample;
