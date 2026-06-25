/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {LogLevel} from '../Data/LogBoxLog';
import type {Message} from '../Data/parseLogBoxLog';

import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import LogBoxMessage from './LogBoxMessage';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

const SHOW_MORE_MESSAGE_LENGTH = 300;

component LogBoxInspectorMessageHeader(
  collapsed: boolean,
  message: Message,
  level: LogLevel,
  title: string,
  onPress: () => void,
) {
  function renderShowMore() {
    if (message.content.length < SHOW_MORE_MESSAGE_LENGTH || !collapsed) {
      return null;
    }
    return (
      <Text style={messageStyles.collapse} onPress={() => onPress()}>
        ... See More
      </Text>
    );
  }

  return (
    <View style={messageStyles.body}>
      <View style={messageStyles.heading}>
        <Text
          style={[messageStyles.headingText, messageStyles[level]]}
          id="logbox_message_title_text">
          {title}
        </Text>
      </View>
      <Text style={messageStyles.bodyText} id="logbox_message_contents_text">
        <LogBoxMessage
          maxLength={collapsed ? SHOW_MORE_MESSAGE_LENGTH : Infinity}
          message={message}
          style={messageStyles.messageText}
        />
        {renderShowMore()}
      </Text>
    </View>
  );
}

const messageStyles = StyleSheet.create({
  body: {
    backgroundColor: LogBoxStyle.getBackgroundColor(1),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 2,
    shadowOpacity: 0.5,
    flex: 0,
  },
  bodyText: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 20,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 5,
  },
  headingText: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 28,
  },
  warn: {
    color: LogBoxStyle.getWarningColor(1),
  },
  error: {
    color: LogBoxStyle.getErrorColor(1),
  },
  fatal: {
    color: LogBoxStyle.getFatalColor(1),
  },
  syntax: {
    color: LogBoxStyle.getFatalColor(1),
  },
  messageText: {
    color: LogBoxStyle.getTextColor(0.6),
  },
  collapse: {
    color: LogBoxStyle.getTextColor(0.7),
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 12,
  },
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 3,
  },
});

export default LogBoxInspectorMessageHeader;
