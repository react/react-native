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
import {StyleSheet, View} from 'react-native';
import {useState, useEffect} from 'react';

/**
 * Proves NativeIdleCallbacks forwards options.timeout into scheduleIdleTask.
 *
 * Strategy: keep scheduling LowPriority work (10s expiry each). That always
 * beats an idle task with the default 5min expiry (bug), but after the first
 * LowPriority tick a patched idle task (LowPriority + timeout ≈ 10s) becomes
 * the earliest-expiring task and runs.
 *
 * Expect with the patch: fire within ~1s.
 * Expect without (`timeout = userTimeout` removed): stuck on "starving…" for minutes.
 */
function Playground() {
  const [label, setLabel] = useState('starving LowPriority queue…');

  useEffect(() => {
    const scheduler = global.nativeRuntimeScheduler;
    const {unstable_scheduleCallback, unstable_LowPriority} = scheduler;

    const start = performance.now();
    let keepStarving = true;

    const starve = () => {
      if (!keepStarving) {
        return;
      }
      unstable_scheduleCallback(unstable_LowPriority, () => {
        const blockStart = performance.now();
        while (performance.now() - blockStart < 30) {}
        starve();
      });
    };

    requestIdleCallback(
      deadline => {
        keepStarving = false;
        const elapsedMs = Math.round(performance.now() - start);
        setLabel(
          `✅ PATCHED: fired after ${elapsedMs}ms under LowPriority load, didTimeout=${String(
            deadline.didTimeout,
          )}`,
        );
      },
      {timeout: 10},
    );

    starve();

    return () => {
      keepStarving = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <RNTesterText>{label}</RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
