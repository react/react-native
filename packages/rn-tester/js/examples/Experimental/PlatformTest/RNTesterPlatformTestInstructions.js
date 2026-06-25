/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = Readonly<{
  instructions?: ReadonlyArray<string>,
  style?: ?ViewStyleProp,
}>;
export default function RNTesterPlatformTestInstructions({
  instructions,
  style,
}: Props): React.MixedElement | null {
  if (instructions == null) {
    return null;
  }
  return (
    <View style={style}>
      {instructions.map((instruction, idx) => {
        return (
          <Text key={idx} style={styles.instructionText}>
            {idx + 1}. {instruction}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  instructionText: {
    fontSize: 16,
  },
});
