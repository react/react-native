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

import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  Appearance,
  Button,
  DynamicColorIOS,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

// Reproducer for https://github.com/facebook/react-native/issues/57836
//
// ONE dynamic color, used for both fills and borders:
// red in light mode, green in dark mode.
//
// Run RNTester on iOS with the simulator's System Appearance set to LIGHT,
// then open this Playground example. The demo forces the app dark via
// Appearance.setColorScheme('dark') after 2s and mounts a second row of
// boxes at 4s.
//
// Expected: once the app is dark, every fill and border is green.
// Actual: fills turn green, but the borders of row A (mounted before the
// override) stay red — the light variant — on both border code paths
// (border-image and CoreAnimation), and persist indefinitely.
const dynamicColor = DynamicColorIOS({light: '#ff3b30', dark: '#34c759'});

function Boxes({label}: {label: string}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.row}>
        <View style={[styles.box, {backgroundColor: dynamicColor}]}>
          <Text style={styles.boxLabel}>fill</Text>
        </View>
        <View
          style={[styles.box, styles.bordered, {borderColor: dynamicColor}]}>
          <Text style={styles.boxLabel}>border{'\n'}(image path)</Text>
        </View>
        <View
          style={[
            styles.box,
            styles.bordered,
            styles.clipped,
            {borderColor: dynamicColor},
          ]}>
          <Text style={styles.boxLabel}>border{'\n'}(CA path)</Text>
        </View>
      </View>
    </View>
  );
}

function Run() {
  const scheme = useColorScheme();
  const [afterOverride, setAfterOverride] = useState(false);
  const [phase, setPhase] = useState('phase 0: system appearance');

  useEffect(() => {
    // Phase 1: the app forces dark while the SYSTEM stays light
    // (RCTAppearance sets overrideUserInterfaceStyle on every window).
    const t1 = setTimeout(() => {
      Appearance.setColorScheme('dark');
      setPhase('phase 1: setColorScheme("dark"), system still Light');
    }, 2000);
    // Phase 2: mount a second set of boxes while the override is active.
    const t2 = setTimeout(() => {
      setAfterOverride(true);
      setPhase('phase 2: second row mounted under the dark override');
    }, 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <View>
      <Text style={styles.title}>useColorScheme(): {String(scheme)}</Text>
      <Text style={styles.subtitle}>{phase}</Text>
      <Boxes label="A: mounted BEFORE the dark override" />
      {afterOverride && <Boxes label="B: mounted AFTER the dark override" />}
      <Text style={styles.footer}>
        Expected: every fill and border shows the SAME color (green once the
        app is dark). Bug: row A's borders stay red — the system (light)
        variant — while its fill turns green.
      </Text>
    </View>
  );
}

function Playground() {
  const [runId, setRunId] = useState(0);
  return (
    <View style={styles.screen}>
      <Run key={runId} />
      <Button
        title="Reset to system scheme & run again"
        onPress={() => {
          Appearance.setColorScheme(null);
          setRunId(id => id + 1);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 16,
    backgroundColor: '#202124',
  },
  title: {fontSize: 18, fontWeight: '600', color: '#fff'},
  subtitle: {fontSize: 13, color: '#bbb', marginTop: 4, marginBottom: 8},
  section: {marginTop: 12},
  sectionLabel: {fontSize: 14, color: '#fff', marginBottom: 8},
  row: {flexDirection: 'row', gap: 12},
  clipped: {overflow: 'hidden'},
  box: {
    width: 100,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  bordered: {borderWidth: 6},
  boxLabel: {color: '#fff', fontSize: 12, textAlign: 'center'},
  footer: {marginVertical: 16, fontSize: 12, color: '#999', lineHeight: 17},
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
