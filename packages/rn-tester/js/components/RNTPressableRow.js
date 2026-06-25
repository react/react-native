/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import RNTesterComponentTitle from './RNTesterComponentTitle';
import {RNTesterThemeContext} from './RNTesterTheme';
import * as React from 'react';
import {useContext} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

type ViewStyleProp = React.ElementConfig<typeof View>['style'];
type Props = {
  accessibilityLabel?: ?string,
  testID?: ?string,
  onPressIn?: ?() => unknown,
  onPressOut?: ?() => unknown,
  children?: ?React.Node,
  title: string,
  description?: ?string,
  onPress: () => unknown,
  style?: ViewStyleProp | ((pressed: boolean) => ViewStyleProp),
};

export default function RNTPressableRow({
  onPressIn,
  onPressOut,
  title,
  description,
  onPress,
  style,
  accessibilityLabel,
}: Props): React.Node {
  const theme = useContext(RNTesterThemeContext);
  const label = accessibilityLabel ?? `${title} ${description ?? ''}`;
  return (
    <Pressable
      testID={title}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityLabel={label}
      style={({pressed}) => [
        styles.row,
        typeof style === 'function' ? style(pressed) : style,
        pressed
          ? {backgroundColor: theme.SecondarySystemFillColor}
          : {backgroundColor: theme.SecondaryGroupedBackgroundColor},
      ]}
      onPress={onPress}>
      <View style={styles.topRowStyle}>
        <RNTesterComponentTitle>{title}</RNTesterComponentTitle>
      </View>
      <Text
        style={[styles.descriptionText, {color: theme.SecondaryLabelColor}]}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 5,
    marginHorizontal: 16,
    boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
  },
  descriptionText: {
    marginTop: 6,
    fontSize: 12,
  },
  topRowStyle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
});
