/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import View from '../../Components/View/View';
import Image from '../../Image/Image';
import StyleSheet from '../../StyleSheet/StyleSheet';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

export default function LogBoxNotificationDismissButton(props: {
  id: string,
  onPress: () => void,
}): React.Node {
  return (
    <View style={styles.container}>
      <LogBoxButton
        id={props.id}
        backgroundColor={{
          default: LogBoxStyle.getTextColor(0.15),
          pressed: LogBoxStyle.getTextColor(0.3),
        }}
        hitSlop={{
          top: 12,
          right: 10,
          bottom: 12,
          left: 10,
        }}
        onPress={props.onPress}
        style={styles.press}>
        <Image
          source={require('./LogBoxImages/close.png')}
          style={styles.image}
        />
      </LogBoxButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    flexDirection: 'row',
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 'auto',
    marginLeft: 5,
  },
  press: {
    height: 20,
    width: 20,
    borderRadius: 25,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: 8,
    width: 8,
    tintColor: LogBoxStyle.getTextColor(0.8),
  },
});
