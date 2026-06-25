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
import {StyleSheet, Text} from 'react-native';

type Props = Readonly<{
  numPass: number,
  numFail: number,
  numError: number,
  numPending: number,
  numSkipped: number,
}>;
export default function RNTesterPlatformTestResultsText(
  props: Props,
): React.MixedElement {
  const {numPass, numFail, numError, numPending, numSkipped} = props;
  return (
    <>
      <Text
        testID={`platform-test-pass-count-${numPass}`}
        style={styles.statText}>
        {numPass} <Text style={styles.passText}>Pass</Text>
      </Text>
      <Text
        testID={`platform-test-fail-count-${numFail}`}
        style={styles.statText}>
        {numFail} <Text style={styles.failText}>Fail</Text>
      </Text>
      {numSkipped > 0 ? (
        <Text style={styles.statText}>
          {numSkipped} <Text style={styles.skippedText}>Skipped</Text>
        </Text>
      ) : null}
      {numError > 0 ? (
        <Text style={styles.statText}>
          {numError} <Text style={styles.errorText}>Error</Text>
        </Text>
      ) : null}
      {numPending > 0 ? (
        <Text style={styles.statText}>
          {numPending} <Text style={styles.pendingText}>Pending</Text>
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: 'orange',
  },
  failText: {
    color: 'red',
  },
  passText: {
    color: 'green',
  },
  pendingText: {
    color: 'gray',
  },
  skippedText: {
    color: 'blue',
  },
  statText: {
    marginEnd: 8,
  },
});
