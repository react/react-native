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
import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';

// Repro for https://github.com/react/react-native/issues/60227
//
// The ScrollView below holds 2^11 = 2048 leaf views (about 4k views in all),
// and none of them sets `removeClippedSubviews`. A small view above it updates
// on every frame, so every frame produces one mounting transaction.
//
// On iOS (Fabric), after every mounting transaction
// `-[RCTScrollViewComponentView mountingTransactionDidMount:withSurfaceTelemetry:]`
// calls `_remountChildren`, which walks the whole content of the ScrollView
// with `updateClippedSubviewsWithClipRect:relativeToView:` and one
// `convertRect:toView:` per view. Nothing can be clipped, so the walk changes
// nothing, but it costs main-thread time on every frame.
//
// To see it: run RNTester (Release) on iOS, open this Playground, and record
// the main thread with Instruments (Time Profiler) or `sample <pid>`.
// `-[UIView(ComponentViewProtocol) updateClippedSubviewsWithClipRect:relativeToView:]`
// and `-[CALayer convertRect:toLayer:]` are under
// `-[RCTScrollViewComponentView mountingTransactionDidMount:withSurfaceTelemetry:]`.
// Tap "Stop" to stop the per-frame updates: the cost goes away.

const DEPTH = 11;

function Nested({depth}: {depth: number}): React.Node {
  if (depth === 0) {
    return <View style={styles.leaf} />;
  }
  return (
    <View style={styles.node}>
      <Nested depth={depth - 1} />
      <Nested depth={depth - 1} />
    </View>
  );
}

function Ticker({running}: {running: boolean}): React.Node {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!running) {
      return;
    }
    let id = requestAnimationFrame(function tick() {
      setFrame(value => value + 1);
      id = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(id);
  }, [running]);
  return (
    <View style={styles.ticker}>
      <View style={[styles.bar, {width: `${frame % 100}%`}]} />
    </View>
  );
}

function Playground() {
  const [running, setRunning] = useState(true);
  return (
    <View style={styles.container}>
      <RNTesterText onPress={() => setRunning(value => !value)}>
        {running
          ? 'Updating every frame. Tap to stop.'
          : 'Stopped. Tap to update every frame.'}
      </RNTesterText>
      <Ticker running={running} />
      <ScrollView style={styles.scrollView}>
        <Nested depth={DEPTH} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'tomato',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 10,
  },
  leaf: {
    backgroundColor: '#ccc',
    height: 4,
    margin: 1,
  },
  node: {
    padding: 1,
  },
  scrollView: {
    flex: 1,
  },
  ticker: {
    height: 8,
    marginVertical: 8,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
