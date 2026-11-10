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

import ScrollView from '../../Components/ScrollView/ScrollView';
import View from '../../Components/View/View';
import StyleSheet from '../../StyleSheet/StyleSheet';
import LogBoxLog from '../Data/LogBoxLog';
import LogBoxInspectorCodeFrame from './LogBoxInspectorCodeFrame';
import LogBoxInspectorMessageHeader from './LogBoxInspectorMessageHeader';
import LogBoxInspectorReactFrames from './LogBoxInspectorReactFrames';
import LogBoxInspectorStackFrames from './LogBoxInspectorStackFrames';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';
import {useEffect, useState} from 'react';

const headerTitleMap = {
  warn: 'Console Warning',
  error: 'Console Error',
  fatal: 'Uncaught Error',
  syntax: 'Syntax Error',
  component: 'Render Error',
};

export default function LogBoxInspectorBody(props: {
  log: LogBoxLog,
  onRetry: () => void,
  safeAreaPadding?: ?ViewStyleProp,
}): React.Node {
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    setCollapsed(true);
  }, [props.log]);

  const headerTitle =
    props.log.type ??
    headerTitleMap[props.log.isComponentError ? 'component' : props.log.level];

  if (collapsed) {
    return (
      <>
        <LogBoxInspectorMessageHeader
          collapsed={collapsed}
          onPress={() => setCollapsed(!collapsed)}
          message={props.log.message}
          level={props.log.level}
          title={headerTitle}
          style={props.safeAreaPadding}
        />
        <ScrollView style={styles.scrollBody}>
          <View style={props.safeAreaPadding}>
            <LogBoxInspectorCodeFrame
              codeFrame={props.log.codeFrame}
              componentCodeFrame={props.log.componentCodeFrame}
            />
            <LogBoxInspectorReactFrames log={props.log} />
            <LogBoxInspectorStackFrames
              log={props.log}
              onRetry={props.onRetry}
            />
          </View>
        </ScrollView>
      </>
    );
  }
  return (
    <ScrollView style={styles.scrollBody}>
      <LogBoxInspectorMessageHeader
        collapsed={collapsed}
        onPress={() => setCollapsed(!collapsed)}
        message={props.log.message}
        level={props.log.level}
        title={headerTitle}
        style={props.safeAreaPadding}
      />
      <View style={props.safeAreaPadding}>
        <LogBoxInspectorCodeFrame
          codeFrame={props.log.codeFrame}
          componentCodeFrame={props.log.componentCodeFrame}
        />
        <LogBoxInspectorReactFrames log={props.log} />
        <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LogBoxStyle.getTextColor(),
  },
  scrollBody: {
    backgroundColor: LogBoxStyle.getBackgroundColor(0.9),
    flex: 1,
  },
});
