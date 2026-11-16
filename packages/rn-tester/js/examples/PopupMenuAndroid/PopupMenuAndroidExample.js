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
import type {PopupMenuAndroidInstance} from '@react-native/popup-menu-android';
import type {Node} from 'react';

import RNTesterText from '../../components/RNTesterText';
import PopupMenuAndroid from '@react-native/popup-menu-android';
import * as React from 'react';
import {useRef, useState} from 'react';
import {Button, StyleSheet, View} from 'react-native';

type Fruit = 'Apple' | 'Pear' | 'Banana' | 'Orange' | 'Kiwi';

const PopupMenu = () => {
  const popupRef = useRef<?PopupMenuAndroidInstance>();
  const [fruit, setFruit] = useState<?Fruit>();
  const fruits: Array<Fruit> = ['Apple', 'Pear', 'Banana', 'Orange', 'Kiwi'];
  const items = fruits.map(item => ({
    label: item,
    onPress: () => {
      setFruit(item);
    },
  }));

  return (
    <View style={styles.container}>
      {fruit ? <RNTesterText>Selected {fruit}</RNTesterText> : null}
      <PopupMenuAndroid
        instanceRef={popupRef}
        menuItems={items.map(({label}) => label)}
        onSelectionChange={selection => items[selection].onPress()}
        onDismiss={() => console.warn('Popup was dismissed!')}>
        <Button
          title="Show PopupMenu!"
          onPress={() => {
            popupRef.current?.show();
          }}
        />
      </PopupMenuAndroid>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});

exports.title = 'PopupMenuAndroid';
// TODO(T175446328): Publish oss documentation for PopupMenuAndroid
exports.description = 'PopupMenuAndroid Example';
exports.examples = [
  {
    title: 'PopupMenu Example',
    render(): Node {
      return <PopupMenu />;
    },
  },
] as Array<RNTesterModuleExample>;
