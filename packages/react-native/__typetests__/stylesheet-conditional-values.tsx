/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

// Style values that depend on media queries.

import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const styles = StyleSheet.create({
  box: {
    width: {default: 100, '@media (prefers-color-scheme: dark)': 200},
    backgroundColor: {
      default: 'white',
      '@media (prefers-color-scheme: dark)': 'black',
    },
  },
});

export function App() {
  return (
    <View style={styles.box}>
      <View
        style={{
          opacity: {default: 1, '@media (prefers-color-scheme: dark)': 0.5},
        }}
      />
      <Text
        style={{
          color: {
            default: 'black',
            '@media (prefers-color-scheme: dark)': 'white',
          },
        }}
      />
    </View>
  );
}

StyleSheet.create({
  wrongType: {
    // @ts-expect-error The values must have the type of the style prop.
    opacity: {default: 1, '@media (prefers-color-scheme: dark)': 'half'},
  },
  unsupportedQuery: {
    // @ts-expect-error Only the supported media queries are allowed.
    opacity: {default: 1, '@media (prefers-color-scheme: drak)': 0.5},
  },
  noDefault: {
    // @ts-expect-error A conditional value needs a `default` value.
    opacity: {'@media (prefers-color-scheme: dark)': 0.5},
  },
  convertedInJavaScript: {
    // @ts-expect-error Components convert this prop in JavaScript.
    resizeMode: {
      default: 'cover',
      '@media (prefers-color-scheme: dark)': 'contain',
    },
  },
});
