/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {RNTesterThemeContext} from './RNTesterTheme';
import RNTesterTitle from './RNTesterTitle';
import {useContext} from 'react';

const React = require('react');
const {Platform, ScrollView, StyleSheet, View} = require('react-native');

type Props = Readonly<{
  children?: React.Node,
  title?: ?string,
  noScroll?: ?boolean,
}>;

function RNTesterPage({children, title, noScroll}: Props): React.Node {
  const theme = useContext(RNTesterThemeContext);

  return (
    <View
      style={[
        styles.background,
        {
          backgroundColor: theme.SecondarySystemBackgroundColor,
          marginTop: Platform.OS === 'ios' ? 50 : 20,
          marginBottom: Platform.OS === 'ios' ? 20 : 10,
        },
      ]}>
      {title && <RNTesterTitle title={title} />}
      {noScroll ? (
        <View style={styles.noscrollWrapper}>{children}</View>
      ) : (
        <ScrollView
          automaticallyAdjustContentInsets={!title}
          contentContainerStyle={styles.scrollWrapperContentContainer}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          style={styles.scrollWrapper}>
          {children}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  noscrollWrapper: {
    flex: 1,
    rowGap: 30,
  },
  scrollWrapper: {
    flex: 1,
  },
  scrollWrapperContentContainer: {
    paddingVertical: 10,
    rowGap: 30,
  },
});

module.exports = RNTesterPage;
