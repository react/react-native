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
import type {Node} from 'react';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Button, Image, StyleSheet, Text, View} from 'react-native';

// Repro for https://github.com/react/react-native/issues/60210
// (ShadowNodeWrapper entries for unmounted host components are never released).
//
// "Run 20 cycles" repeatedly mounts and unmounts a subtree of ordinary host
// components (nested Views, Text, and a local Image). Each mount uses a new
// `generation` key so every cycle creates brand-new host nodes instead of
// reusing them. On the new architecture / bridgeless, Native Heap grows on
// every unmount and never returns to its previous floor after a GC.
//
// Measurement:
//   adb shell dumpsys meminfo com.facebook.react.uiapp | grep -i "Native Heap"
// Use the "GC" button (calls Hermes' global.gc(), same as DevTools'
// "Collect garbage") between samples. Run the loop a second time with a
// manual GC between cycles: the post-GC Native Heap should keep climbing
// instead of returning to the baseline.

const CYCLES = 20;
const STEP_MS = 500;
const ROWS = 40;
const THUMB = require('../../assets/uie_thumb_normal.png');

function Leaf({label}: {label: string}): Node {
  return (
    <View style={styles.row}>
      <Image source={THUMB} style={styles.thumb} />
      <View style={styles.textColumn}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subLabel}>row host nodes</Text>
      </View>
    </View>
  );
}

function HeavySubtree({generation}: {generation: number}): Node {
  return (
    <View style={styles.tree} testID="shadow-node-wrapper-retention-tree">
      {Array.from({length: ROWS}, (_unused, row) => (
        <View key={row} style={styles.group}>
          <View style={styles.card}>
            <Leaf label={`gen ${generation} / row ${row} / a`} />
            <Leaf label={`gen ${generation} / row ${row} / b`} />
          </View>
        </View>
      ))}
    </View>
  );
}

function Playground(): Node {
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!running) {
      return undefined;
    }
    const intervalId = setInterval(() => {
      setCycle(current => current + 1);
    }, STEP_MS);
    return () => clearInterval(intervalId);
  }, [running]);

  useEffect(() => {
    if (cycle >= CYCLES * 2) {
      setRunning(false);
    }
  }, [cycle]);

  // Odd steps mount a fresh subtree, even steps unmount it. `generation`
  // changes on every mount so the unmounted nodes are never reused.
  const mounted = running && cycle > 0 && cycle % 2 === 1;
  const generation = Math.floor((cycle + 1) / 2);
  const completed = Math.min(Math.floor(cycle / 2), CYCLES);

  const start = () => {
    setCycle(0);
    setRunning(true);
  };

  const triggerGC = () => {
    // Hermes exposes gc() in dev builds; DevTools' "Collect garbage" calls
    // the same thing over the debugger protocol. No-op on release/JSC.
    const gc = (global: any).gc;
    if (typeof gc === 'function') {
      gc();
    }
  };

  return (
    <View style={styles.container} testID="shadow-node-wrapper-retention-probe">
      <RNTesterText>ShadowNodeWrapper unmount retention (#60210)</RNTesterText>
      <RNTesterText>{`Complete cycles: ${completed} / ${CYCLES}`}</RNTesterText>
      <View style={styles.controls}>
        <Button title="Run 20 mount/unmount cycles" onPress={start} disabled={running} />
        <Button title="Stop" onPress={() => setRunning(false)} disabled={!running} />
        <Button title="GC" onPress={triggerGC} />
      </View>
      {mounted ? <HeavySubtree key={generation} generation={generation} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  controls: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
  },
  tree: {
    flexGrow: 1,
  },
  group: {
    marginVertical: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: '#cccccc',
    borderRadius: 4,
    padding: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumb: {
    width: 24,
    height: 24,
  },
  textColumn: {
    flex: 1,
    marginLeft: 6,
  },
  label: {
    fontSize: 12,
  },
  subLabel: {
    fontSize: 10,
    color: '#666666',
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
