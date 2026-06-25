/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodeFrame} from '../Data/parseLogBoxLog';

import ScrollView from '../../Components/ScrollView/ScrollView';
import View from '../../Components/View/View';
import openFileInEditor from '../../Core/Devtools/openFileInEditor';
import StyleSheet from '../../StyleSheet/StyleSheet';
import Text from '../../Text/Text';
import Platform from '../../Utilities/Platform';
import * as LogBoxData from '../Data/LogBoxData';
import AnsiHighlight from './AnsiHighlight';
import LogBoxButton from './LogBoxButton';
import LogBoxInspectorSection from './LogBoxInspectorSection';
import * as LogBoxStyle from './LogBoxStyle';
import * as React from 'react';

component CodeFrameDisplay(codeFrame: CodeFrame) {
  function getFileName() {
    // $FlowFixMe[incompatible-use]
    const matches = /[^/]*$/.exec(codeFrame.fileName);
    if (matches && matches.length > 0) {
      return matches[0];
    }

    // $FlowFixMe[incompatible-use]
    return codeFrame.fileName;
  }

  function getLocation() {
    // $FlowFixMe[incompatible-use]
    const location = codeFrame.location;
    if (location != null) {
      return ` (${location.row}:${
        location.column + 1 /* Code frame columns are zero indexed */
      })`;
    }

    return null;
  }

  return (
    <View style={styles.box}>
      <View style={styles.frame}>
        <ScrollView horizontal contentContainerStyle={styles.contentContainer}>
          <AnsiHighlight style={styles.content} text={codeFrame.content} />
        </ScrollView>
      </View>
      <LogBoxButton
        backgroundColor={{
          default: 'transparent',
          pressed: LogBoxStyle.getBackgroundDarkColor(1),
        }}
        style={styles.button}
        onPress={() => {
          openFileInEditor(codeFrame.fileName, codeFrame.location?.row ?? 0);
        }}>
        <Text style={styles.fileText}>
          {getFileName()}
          {getLocation()}
        </Text>
      </LogBoxButton>
    </View>
  );
}

component LogBoxInspectorCodeFrame(
  componentCodeFrame: ?CodeFrame,
  codeFrame: ?CodeFrame,
) {
  let sources = [];
  if (codeFrame != null) {
    sources.push(codeFrame);
  }
  if (
    componentCodeFrame != null &&
    componentCodeFrame?.content !== codeFrame?.content
  ) {
    sources.push(componentCodeFrame);
  }
  if (sources.length === 0) {
    return null;
  }
  return (
    <LogBoxInspectorSection
      heading={sources.length > 1 ? 'Sources' : 'Source'}
      action={<AppInfo />}>
      {sources.map((frame, index) => (
        <CodeFrameDisplay key={index} codeFrame={frame} />
      ))}
    </LogBoxInspectorSection>
  );
}

component AppInfo() {
  const appInfo = LogBoxData.getAppInfo();
  if (appInfo == null) {
    return null;
  }

  return (
    <LogBoxButton
      backgroundColor={{
        default: 'transparent',
        pressed: appInfo.onPress
          ? LogBoxStyle.getBackgroundColor(1)
          : 'transparent',
      }}
      style={appInfoStyles.buildButton}
      onPress={appInfo.onPress}>
      <Text style={appInfoStyles.text}>
        {appInfo.appVersion} ({appInfo.engine})
      </Text>
    </LogBoxButton>
  );
}

const appInfoStyles = StyleSheet.create({
  text: {
    color: LogBoxStyle.getTextColor(0.4),
    fontSize: 12,
    lineHeight: 12,
  },
  buildButton: {
    flex: 0,
    flexGrow: 0,
    paddingVertical: 4,
    paddingHorizontal: 5,
    borderRadius: 5,
    marginRight: -8,
  },
});

const styles = StyleSheet.create({
  box: {
    backgroundColor: LogBoxStyle.getBackgroundColor(),
    marginLeft: 10,
    marginRight: 10,
    marginTop: 5,
    borderRadius: 3,
  },
  frame: {
    padding: 10,
    borderBottomColor: LogBoxStyle.getTextColor(0.1),
    borderBottomWidth: 1,
  },
  button: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  contentContainer: {
    minWidth: '100%',
  },
  content: {
    color: LogBoxStyle.getTextColor(1),
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 20,
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
  fileText: {
    color: LogBoxStyle.getTextColor(0.5),
    textAlign: 'center',
    flex: 1,
    fontSize: 12,
    includeFontPadding: false,
    lineHeight: 16,
    fontFamily: Platform.select({android: 'monospace', ios: 'Menlo'}),
  },
});

export default LogBoxInspectorCodeFrame;
