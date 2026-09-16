/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
// @ts-ignore
import {View, StyleSheet, type ShadowStyleIOS} from 'react-native';

export function App() {
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'red',
    width: '100%',
    height: '100%',
  },
  transforms: {
    transform: [
      {matrix: [0, 1, -1, 0, 0, 0]},
      {skewX: '40deg'},
      {translateX: 40},
      {translateY: 40},
      {rotate: '30deg'},
    ],
  },
});

const styles2 = StyleSheet.create({
  container: {
    position: 'absolute',
    // Should error due to misspelled parameter name
    // @ts-expect-error
    magrinRight: 1,
  },
});

const shadowOffsetConst: Readonly<ShadowStyleIOS['shadowOffset']> = {
  width: 1,
  height: 2,
};

const styles3 = StyleSheet.create({
  transforms: {
    transform: [{translateX: 40}] as const,
    shadowOffset: shadowOffsetConst,
  },
});
