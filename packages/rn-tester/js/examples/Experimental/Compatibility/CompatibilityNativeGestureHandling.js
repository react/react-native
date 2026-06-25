/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../../types/RNTesterTypes';

import EventfulView from '../W3CPointerEventsEventfulView';
import * as React from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  eventfulView: {
    borderWidth: 1,
    height: 100,
    width: '100%',
  },
  lighblue: {
    backgroundColor: 'lightblue',
  },
  item: {
    height: 40,
  },
});

function CompatibilityNativeGestureHandling(): React.Node {
  return (
    <View style={styles.container}>
      <ScrollView>
        {Array(100)
          .fill()
          .map((_, index) => {
            return (
              <EventfulView
                log={console.log}
                onDown
                onCancel
                key={index}
                name={`${index}`}
                style={[styles.item, index % 2 === 0 ? styles.lighblue : null]}
              />
            );
          })}
      </ScrollView>
    </View>
  );
}

export default {
  name: 'compatibility_native_gesture',
  title: 'Native Gesture Handling Example',
  description:
    'Scroll to trigger a native gesture. Verify no native events are being fired once a native gesture starts until it ends. A pointer cancel will be triggered when a native gesture starts.',
  render(): React.Node {
    return <CompatibilityNativeGestureHandling />;
  },
} as RNTesterModuleExample;
