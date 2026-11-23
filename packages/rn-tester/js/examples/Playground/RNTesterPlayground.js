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
import {useEffect, useLayoutEffect, useState} from 'react';
import {Button, StyleSheet, Text, View} from 'react-native';

// Reproducer for a data race in RCTComponentViewFactory (iOS, Fabric):
// registering a component name the factory has never seen (the
// UnimplementedView / legacy interop fallbacks of _registerComponentIfPossible:)
// writes the factory's maps without its lock on the JS thread, while the main
// thread reads them in createComponentViewWithComponentHandle:.
//
// Each frame on which a large Text batch commits (more views than the 1024-view
// recycle pool, so the main thread creates new ones), detached shadow nodes are
// created under fresh names right after the commit. Each fresh name forces a
// fallback registration while the main thread is still mounting the batch.
//
// With ThreadSanitizer on RCTComponentViewFactory.mm this reports a data race
// within seconds. Without it, Debug builds intermittently abort with
// "ComponentView with componentHandle ... (Paragraph) not found".

const FRAMES = 240;
const NAMES_PER_FRAME = 3000;
const TEXTS = 1500;

let nextName = 0;

function registerFreshNames(count: number): void {
  // $FlowFixMe[cannot-resolve-name] Fabric's JSI binding
  const fabric = global.nativeFabricUIManager;
  if (fabric == null) {
    throw new Error('This reproducer needs the New Architecture (Fabric)');
  }
  for (let i = 0; i < count; i++) {
    const n = nextName++;
    fabric.createNode(2_000_000_000 + n * 2, `ReproProbe${n}`, 1, {}, {});
  }
}

function Stress(): React.Node {
  const [frame, setFrame] = useState(0);
  const done = frame >= FRAMES;

  useLayoutEffect(() => {
    if (!done && frame % 2 === 0) {
      registerFreshNames(NAMES_PER_FRAME);
    }
  }, [frame, done]);

  useEffect(() => {
    if (done) {
      return;
    }
    const id = requestAnimationFrame(() => setFrame(f => f + 1));
    return () => cancelAnimationFrame(id);
  }, [frame, done]);

  if (done) {
    return <RNTesterText testID="repro-done">Done: no crash</RNTesterText>;
  }
  return (
    <View style={styles.batch}>
      {frame % 2 === 0
        ? Array.from({length: TEXTS}, (_, i) => (
            <Text key={i} style={styles.probe}>
              Probe
            </Text>
          ))
        : null}
    </View>
  );
}

function Playground(): React.Node {
  const [running, setRunning] = useState(false);
  return (
    <View style={styles.container}>
      <RNTesterText>
        RCTComponentViewFactory registration race (iOS, Fabric). Build with
        ThreadSanitizer on RCTComponentViewFactory.mm, then press Start.
      </RNTesterText>
      {running ? (
        <Stress />
      ) : (
        <Button
          testID="repro-start"
          title="Start"
          onPress={() => setRunning(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  batch: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  container: {
    padding: 10,
  },
  probe: {
    fontSize: 10,
    margin: 1,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
