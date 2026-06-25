/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../Components/View/ViewPropTypes';
import type {LogLevel} from '../Data/LogBoxLog';

import SafeAreaView from '../../Components/SafeAreaView/SafeAreaView';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import Platform from '../../Utilities/Platform';
import LogBoxInspectorHeaderButton from './LogBoxInspectorHeaderButton';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

type Props = Readonly<{
  onSelectIndex: (selectedIndex: number) => void,
  selectedIndex: number,
  total: number,
  level: LogLevel,
}>;

const LogBoxInspectorHeaderSafeArea: React.ComponentType<ViewProps> =
  Platform.OS === 'android' ? View : SafeAreaView;

export default function LogBoxInspectorHeader(props: Props): React.Node {
  if (props.level === 'syntax') {
    return (
      <LogBoxInspectorHeaderSafeArea style={styles[props.level]}>
        <View style={styles.header}>
          <View style={styles.title}>
            <Text style={styles.titleText} id="logbox_header_title_text">
              Failed to compile
            </Text>
          </View>
        </View>
      </LogBoxInspectorHeaderSafeArea>
    );
  }

  const prevIndex =
    props.selectedIndex - 1 < 0 ? props.total - 1 : props.selectedIndex - 1;
  const nextIndex =
    props.selectedIndex + 1 > props.total - 1 ? 0 : props.selectedIndex + 1;

  const titleText = `Log ${props.selectedIndex + 1} of ${props.total}`;

  return (
    <LogBoxInspectorHeaderSafeArea style={styles[props.level]}>
      <View style={styles.header}>
        <LogBoxInspectorHeaderButton
          id="logbox_header_button_prev"
          disabled={props.total <= 1}
          level={props.level}
          image={require('./LogBoxImages/chevron-left.png')}
          onPress={() => props.onSelectIndex(prevIndex)}
        />
        <View style={styles.title}>
          <Text style={styles.titleText} id="logbox_header_title_text">
            {titleText}
          </Text>
        </View>
        <LogBoxInspectorHeaderButton
          id="logbox_header_button_next"
          disabled={props.total <= 1}
          level={props.level}
          image={require('./LogBoxImages/chevron-right.png')}
          onPress={() => props.onSelectIndex(nextIndex)}
        />
      </View>
    </LogBoxInspectorHeaderSafeArea>
  );
}

const styles = StyleSheet.create({
  syntax: {
    backgroundColor: LogBoxStyle.getFatalColor(),
  },
  fatal: {
    backgroundColor: LogBoxStyle.getFatalColor(),
  },
  warn: {
    backgroundColor: LogBoxStyle.getWarningColor(),
  },
  error: {
    backgroundColor: LogBoxStyle.getErrorColor(),
  },
  header: {
    flexDirection: 'row',
    height: Platform.select({
      android: 48,
      ios: 44,
    }),
  },
  title: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: LogBoxStyle.getTextColor(),
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 20,
  },
});
