/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Message as MessageType} from '../Data/parseLogBoxLog';

import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import LogBoxMessage from './LogBoxMessage';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

export default function LogBoxNotificationMessage(props: {
  message: MessageType,
}): React.Node {
  return (
    <View style={styles.container}>
      <Text
        id="logbox_notification_message_text"
        maxFontSizeMultiplier={1}
        numberOfLines={1}
        style={styles.text}>
        {props.message && (
          <LogBoxMessage
            plaintext
            message={props.message}
            style={styles.substitutionText}
          />
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 'auto',
    borderLeftColor: LogBoxStyle.getTextColor(0.2),
    borderLeftWidth: 1,
    paddingLeft: 8,
  },
  text: {
    color: LogBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
  },
  substitutionText: {
    color: LogBoxStyle.getTextColor(0.6),
  },
});
