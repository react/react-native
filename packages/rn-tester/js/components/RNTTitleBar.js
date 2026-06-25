/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import RNTesterDocumentationURL from './RNTesterDocumentationURL';
import {type RNTesterTheme} from './RNTesterTheme';
import * as React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';

const HeaderIOS = ({
  children,
  title,
  documentationURL,
  theme,
}: {
  children?: React.Node,
  title: string,
  documentationURL?: string,
  theme: RNTesterTheme,
}) => {
  return (
    <View
      style={[styles.header, {backgroundColor: theme.SystemBackgroundColor}]}>
      <View style={styles.headerCenter}>
        <Text style={{...styles.title, color: theme.LabelColor}}>{title}</Text>
        {documentationURL && (
          <RNTesterDocumentationURL documentationURL={documentationURL} />
        )}
      </View>
      {children != null && <View>{children}</View>}
    </View>
  );
};

const HeaderAndroid = ({
  children,
  title,
  documentationURL,
  theme,
}: {
  children?: React.Node,
  title: string,
  documentationURL?: string,
  theme: RNTesterTheme,
}) => {
  return (
    <View style={[styles.toolbar, {backgroundColor: theme.BackgroundColor}]}>
      <View style={styles.toolbarCenter}>
        <Text style={[styles.title, {color: theme.LabelColor}]}>{title}</Text>
        {documentationURL && (
          <RNTesterDocumentationURL documentationURL={documentationURL} />
        )}
      </View>
      {children != null && <View>{children}</View>}
    </View>
  );
};

export default function RNTTitleBar({
  children,
  title,
  documentationURL,
  theme,
}: {
  children?: React.Node,
  title: string,
  documentationURL?: string,
  theme: RNTesterTheme,
  ...
}): React.Node {
  return Platform.OS === 'ios' ? (
    <HeaderIOS
      documentationURL={documentationURL}
      title={title}
      children={children}
      theme={theme}
    />
  ) : (
    <HeaderAndroid
      documentationURL={documentationURL}
      title={title}
      children={children}
      theme={theme}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  header: {
    height: 40,
    flexDirection: 'row',
    marginTop: Platform.OS === 'ios' && !Platform.isTV ? 50 : 0,
  },
  headerCenter: {
    flex: 1,
    position: 'absolute',
    top: 7,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  toolbar: {
    height: 56,
    flexDirection: 'row',
  },
  toolbarCenter: {
    flex: 1,
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
