/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {SafeAreaInsetsChangeEvent} from '../../Types/CoreEventTypes';

import Keyboard from '../../Components/Keyboard/Keyboard';
import View from '../../Components/View/View';
import I18nManager from '../../ReactNative/I18nManager';
import StyleSheet from '../../StyleSheet/StyleSheet';
import BackHandler from '../../Utilities/BackHandler';
import * as LogBoxData from '../Data/LogBoxData';
import LogBoxLog, {type LogLevel} from '../Data/LogBoxLog';
import LogBoxInspectorBody from './LogBoxInspectorBody';
import LogBoxInspectorFooter from './LogBoxInspectorFooter';
import LogBoxInspectorHeader from './LogBoxInspectorHeader';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';

type Props = Readonly<{
  onDismiss: () => void,
  onChangeSelectedIndex: (index: number) => void,
  onMinimize: () => void,
  logs: ReadonlyArray<LogBoxLog>,
  selectedIndex: number,
  fatalType?: ?LogLevel,
}>;

export default function LogBoxInspector(props: Props): React.Node {
  const {logs, selectedIndex, onMinimize} = props;
  let log = logs[selectedIndex];

  useEffect(() => {
    if (log) {
      LogBoxData.symbolicateLogNow(log);
    }
  }, [log]);

  useEffect(() => {
    // Optimistically symbolicate the last and next logs.
    if (logs.length > 1) {
      const selected = selectedIndex;
      const lastIndex = logs.length - 1;
      const prevIndex = selected - 1 < 0 ? lastIndex : selected - 1;
      const nextIndex = selected + 1 > lastIndex ? 0 : selected + 1;
      LogBoxData.symbolicateLogLazy(logs[prevIndex]);
      LogBoxData.symbolicateLogLazy(logs[nextIndex]);
    }
  }, [logs, selectedIndex]);

  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  const [safeAreaPadding, setSafeAreaPadding] = useState<?ViewStyleProp>(null);
  const handleSafeAreaInsetsChange = useCallback(
    (event: SafeAreaInsetsChangeEvent) => {
      const {left, right} = event.nativeEvent.insets;
      // Insets are physical edges. Logical edges resolve by layout direction
      // alone, which keeps clear of the RTL left/right swap.
      const {isRTL} = I18nManager.getConstants();
      setSafeAreaPadding({
        paddingStart: isRTL ? right : left,
        paddingEnd: isRTL ? left : right,
      });
    },
    [],
  );

  useEffect(() => {
    if (log == null) {
      return;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onMinimize();
        return true;
      },
    );
    return () => subscription.remove();
  }, [log, onMinimize]);

  function _handleRetry() {
    LogBoxData.retrySymbolicateLogNow(log);
  }

  function _handleCopy() {
    const headerTitleMap = {
      warn: 'Console Warning',
      error: 'Console Error',
      fatal: 'Uncaught Error',
      syntax: 'Syntax Error',
      component: 'Render Error',
    };

    const title =
      log.type ??
      headerTitleMap[log.isComponentError ? 'component' : log.level];

    const parts = [title, '', log.message.content];

    if (log.codeFrame != null) {
      const location = log.codeFrame.location;
      parts.push(
        '',
        'Source:',
        location != null
          ? `${log.codeFrame.fileName} (${location.row}:${location.column})`
          : log.codeFrame.fileName,
      );
    }

    const stack = log.getAvailableStack();
    if (stack.length > 0) {
      parts.push('', 'Call Stack:');
      for (const frame of stack) {
        const methodName = frame.methodName ?? '?';
        const file = frame.file ?? '?';
        const lineNumber =
          frame.lineNumber != null ? `:${frame.lineNumber}` : '';
        parts.push(`${methodName} (${file}${lineNumber})`);
      }
    }

    // Lazy-require to avoid crashing in environments where the native
    // Clipboard module is unavailable (e.g. Fantom integration tests).
    const Clipboard = require('../../Components/Clipboard/Clipboard').default;
    Clipboard.setString(parts.join('\n'));
  }

  if (log == null) {
    return null;
  }

  return (
    <View
      id="logbox_inspector"
      style={styles.root}
      experimental_onSafeAreaInsetsChange={handleSafeAreaInsetsChange}>
      <LogBoxInspectorHeader
        onSelectIndex={props.onChangeSelectedIndex}
        selectedIndex={selectedIndex}
        total={logs.length}
        level={log.level}
      />
      <LogBoxInspectorBody
        log={log}
        onRetry={_handleRetry}
        safeAreaPadding={safeAreaPadding}
      />
      <LogBoxInspectorFooter
        onDismiss={props.onDismiss}
        onMinimize={props.onMinimize}
        onCopy={_handleCopy}
        level={log.level}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogBoxStyle.getTextColor(),
  },
});
