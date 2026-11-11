/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {PlatformTestComponentBaseProps} from './RNTesterPlatformTestTypes';

import RNTesterText from '../../../components/RNTesterText';
import RNTesterPlatformTestInstructions from './RNTesterPlatformTestInstructions';
import RNTesterPlatformTestResultView from './RNTesterPlatformTestResultView';
import usePlatformTestHarness from './usePlatformTestHarness';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

export default component RNTesterPlatformTest(
  title: string,
  description: string,
  instructions?: ReadonlyArray<string>,
  component as UnderTestComponent: React.ComponentType<PlatformTestComponentBaseProps>,
) {
  const {harness, numPending, reset, results, testKey} =
    usePlatformTestHarness();

  return (
    <View style={styles.root}>
      <View style={styles.testcaseContainer}>
        <RNTesterText style={[styles.textBlock, styles.title]}>
          {title}
        </RNTesterText>
        {description !== '' ? (
          <RNTesterText style={[styles.textBlock, styles.description]}>
            {description}
          </RNTesterText>
        ) : null}
        <RNTesterPlatformTestInstructions
          instructions={instructions}
          style={[styles.instructions, styles.block]}
        />
        <View style={[styles.testContainer, styles.block]}>
          <UnderTestComponent key={testKey} harness={harness} />
        </View>
      </View>
      <RNTesterPlatformTestResultView
        numPending={numPending}
        reset={reset}
        results={results}
        style={styles.results}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
  },
  instructions: {
    flexGrow: 0,
    flexShrink: 0,
  },
  textBlock: {
    marginBottom: 8,
    flexGrow: 0,
    flexShrink: 0,
  },
  results: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
  },
  root: {
    flex: 1,
  },
  testcaseContainer: {
    padding: 8,
  },
  testContainer: {
    flexGrow: 0,
    flexShrink: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
});
