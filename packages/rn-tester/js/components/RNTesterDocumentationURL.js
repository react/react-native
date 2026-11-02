/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import {getDevServer} from 'react-native/unstable-internals-do-not-use';

type Props = Readonly<{
  documentationURL: string,
}>;

function openURLInBrowser(url: string): void {
  void fetch(getDevServer().url + 'open-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({url}),
  });
}

const RNTesterDocumentationURL = ({documentationURL}: Props): React.Node => (
  <TouchableOpacity
    style={styles.container}
    onPress={() => openURLInBrowser(documentationURL)}>
    <Image
      source={require('../assets/documentation.png')}
      style={styles.icon}
    />
  </TouchableOpacity>
);

export default RNTesterDocumentationURL;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: -15,
  },
  icon: {
    height: 24,
  },
});
