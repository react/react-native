/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import SafeAreaView from '../../Components/SafeAreaView/SafeAreaView';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

type ButtonProps = Readonly<{
  id: string,
  onPress: () => void,
  text: string,
}>;

export default function LogBoxInspectorFooterButton(
  props: ButtonProps,
): React.Node {
  return (
    <SafeAreaView style={styles.button}>
      <LogBoxButton
        id={props.id}
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundDarkColor(),
        }}
        onPress={props.onPress}>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonLabel}>{props.text}</Text>
        </View>
      </LogBoxButton>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
  buttonContent: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
  },
  buttonLabel: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
  },
});
