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
import {Button, ScrollView, StyleSheet} from 'react-native';

function Playground() {
  return (
    <ScrollView contentContainerStyle={styles.container} scrollEnabled={false}>
      <Button title={'Button1'} />
      <Button title={'Button2'} />
      <Button title={'Button3'} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 100,
    gap: 20,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
