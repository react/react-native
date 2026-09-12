/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {processColor, StyleSheet, View} from 'react-native';

// Reproducer for https://github.com/facebook/react-native/issues/58495
// On main, functional color strings with surrounding junk still normalize
// (same as a valid rgb()), so processColor returns a non-null value and the
// swatch paints. Expected: junk inputs should be null / no fill.
const CASES: $ReadOnlyArray<{label: string, color: string, expectNull: boolean}> =
  [
    {label: 'valid rgb', color: 'rgb(1, 2, 3)', expectNull: false},
    {label: 'junk around rgb', color: 'xxrgb(1, 2, 3)yy', expectNull: true},
    {label: 'rgb with suffix', color: 'rgb(1, 2, 3)yy', expectNull: true},
    {
      label: 'rgba with suffix',
      color: 'rgba(1,2,3,0.5)extra',
      expectNull: true,
    },
    {label: 'hex rejects spaces', color: ' #fff ', expectNull: true},
  ];

function Playground() {
  return (
    <View style={styles.container}>
      <RNTesterText style={styles.title}>
        Issue #58495 — normalize-color partial match
      </RNTesterText>
      <RNTesterText>
        Junk functional strings should process to null (like spaced hex). On
        main they currently resolve and paint.
      </RNTesterText>
      {CASES.map(testCase => {
        const processed = processColor(testCase.color);
        const isNull = processed == null;
        const unexpected = isNull !== testCase.expectNull;
        return (
          <View key={testCase.label} style={styles.row}>
            <View
              style={[
                styles.swatch,
                processed != null ? {backgroundColor: testCase.color} : null,
              ]}
            />
            <View style={styles.meta}>
              <RNTesterText>
                {testCase.label}: {JSON.stringify(testCase.color)}
              </RNTesterText>
              <RNTesterText>
                processColor → {processed == null ? 'null' : String(processed)}
                {unexpected ? '  ← unexpected on main' : ''}
              </RNTesterText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    gap: 12,
  },
  title: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swatch: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: '#999',
  },
  meta: {
    flex: 1,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
