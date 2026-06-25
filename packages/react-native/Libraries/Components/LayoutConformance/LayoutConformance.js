/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import StyleSheet from '../../StyleSheet/StyleSheet';
import LayoutConformanceNativeComponent from './LayoutConformanceNativeComponent';
import * as React from 'react';

export type LayoutConformanceProps = Readonly<{
  /**
   * strict: Layout in accordance with W3C spec, even when breaking
   * compatibility: Layout with the same behavior as previous versions of React Native
   */
  mode: 'strict' | 'compatibility',
  children: React.Node,
}>;

export default component LayoutConformance(...props: LayoutConformanceProps) {
  return (
    <LayoutConformanceNativeComponent {...props} style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'contents',
  },
});
