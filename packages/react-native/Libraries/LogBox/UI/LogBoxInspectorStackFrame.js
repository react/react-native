/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {StackFrame} from '../../Core/NativeExceptionsManager';
import type {GestureResponderEvent} from '../../Types/CoreEventTypes';

import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import Platform from '../../Utilities/Platform';
import LogBoxButton from './LogBoxButton';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

const noop = () => {};

component LogBoxInspectorStackFrame(
  frame: StackFrame,
  onPress?: ?(event: GestureResponderEvent) => void,
) {
  const column = frame.column != null && parseInt(frame.column, 10);
  const location =
    getFileName(frame.file) +
    (frame.lineNumber != null
      ? ':' +
        frame.lineNumber +
        (column && !isNaN(column) ? ':' + (column + 1) : '')
      : '');
  return (
    <View style={styles.frameContainer}>
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: onPress ? LogBoxStyle.getBackgroundColor(1) : 'transparent',
        }}
        onPress={onPress ?? noop}
        style={styles.frame}>
        <Text
          id="logbox_stack_frame_text"
          style={[styles.name, frame.collapse === true && styles.dim]}>
          {frame.methodName}
        </Text>
        <Text
          ellipsizeMode="middle"
          numberOfLines={1}
          style={[styles.location, frame.collapse === true && styles.dim]}>
          {location}
        </Text>
      </LogBoxButton>
    </View>
  );
}

function getFileName(file: ?string) {
  if (file == null) {
    return '<unknown>';
  }
  const queryIndex = file.indexOf('?');
  return file.substring(
    file.lastIndexOf('/') + 1,
    queryIndex === -1 ? file.length : queryIndex,
  );
}

const styles = StyleSheet.create({
  frameContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
  },
  frame: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  lineLocation: {
    flexDirection: 'row',
  },
  name: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    fontWeight: '400',
    fontFamily: Platform.select({
      android: 'monospace',
      ios: 'Menlo',
      macos: 'Menlo',
      windows: 'Consolas',
    }),
  },
  location: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
    paddingLeft: 10,
  },
  dim: {
    color: LogBoxStyle.getTextColor(0.4),
    fontWeight: '300',
  },
  line: {
    color: LogBoxStyle.getTextColor(0.8),
    fontSize: 12,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 16,
  },
});

export default LogBoxInspectorStackFrame;
