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
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

export default function LogBoxNotificationCountBadge(props: {
  count: number,
  level: 'error' | 'warn',
}): React.Node {
  return (
    <View style={styles.outside}>
      {/* $FlowFixMe[incompatible-type] (>=0.114.0) This suppression was added
       * when fixing the type of `StyleSheet.create`. Remove this comment to
       * see the error. */}
      <View style={[styles.inside, styles[props.level]]}>
        <Text
          id="logbox_notification_count_text"
          maxFontSizeMultiplier={1}
          style={styles.text}>
          {props.count <= 1 ? '!' : props.count}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  warn: {
    backgroundColor: LogBoxStyle.getWarningColor(1),
  },
  error: {
    backgroundColor: LogBoxStyle.getErrorColor(1),
  },
  outside: {
    padding: 2,
    borderRadius: 25,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  inside: {
    minWidth: 18,
    paddingLeft: 4,
    paddingRight: 4,
    borderRadius: 25,
    fontWeight: '600',
  },
  text: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: LogBoxStyle.getBackgroundColor(0.4),
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 3,
  },
});
