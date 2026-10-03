/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * Reproducer for react-native#57950 (Android, Fabric / new architecture)
 *
 * Fabric measures every <Text> with ONE shared, thread-local TextPaint. For text without an
 * explicit fontFamily/fontWeight/fontStyle, updateTextPaint() restores the default with
 * `paint.reset(); paint.setTypeface(null)`. On some OEM ROMs that does not restore the typeface:
 * `Paint.reset()` keeps the resolved font, and the following `Paint.setTypeface(null)` is a no-op
 * when the paint's Java-level typeface is already null. The paint therefore keeps the last
 * typeface that was set *explicitly*, and every following plain <Text> is measured with it while
 * ReactTextView renders with the real system font -> line boxes too short / glyphs clipped.
 *
 * This screen needs no bundled font: any explicit font family poisons the shared paint. It uses the
 * framework alias "casual" (Dancing Script) because its vertical metrics are far from the default
 * font's on every Android version, so the two rows are trivially distinguishable.
 *
 * Rows R2/R3 use DIFFERENT strings: RN caches text layouts per attributed string, and identical
 * strings would silently reuse R1's layout and hide the bug.
 *
 * Verified on device (fontSize 48, metrics in px, ascender/descender/height):
 *
 *   Xiaomi 17 Max, HyperOS, unpatched 0.78.3 : R1 49.7/23.7/73.3  R2 49.7/23.7/73.3  R3 49.7/23.7/73.3  -> REPRODUCED
 *   Xiaomi 17 Max, HyperOS, patched    0.78.3: R1 49.7/23.7/73.3  R2 50.3/13.7/64.0  R3 50.3/13.7/64.0  -> fixed
 *   Xiaomi Pad 4 Plus, stock AOSP 16, unpatched: R1 49.5/23.5/73.0 R2 45.0/14.0/59.0 R3 45.0/14.0/59.0 -> not affected
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {StyleSheet, View} from 'react-native';

const FONT_SIZE = 48;
const EPSILON = 0.5;

type Metrics = {ascender: number, descender: number, height: number};

function useTextMetrics(): [Metrics | null, (e: any) => void] {
  const [metrics, setMetrics] = React.useState<Metrics | null>(null);
  const onTextLayout = React.useCallback((e: any) => {
    const line = e.nativeEvent.lines[0];
    setMetrics({
      ascender: line.ascender,
      descender: line.descender,
      height: line.height,
    });
  }, []);
  return [metrics, onTextLayout];
}

function Sample({
  label,
  text,
  fontFamily,
  onMetrics,
}: {
  label: string,
  text: string,
  fontFamily?: string,
  onMetrics?: (m: Metrics) => void,
}) {
  const [metrics, onTextLayout] = useTextMetrics();
  React.useEffect(() => {
    if (metrics != null && onMetrics != null) {
      onMetrics(metrics);
    }
  }, [metrics, onMetrics]);
  return (
    <View style={styles.row}>
      <RNTesterText style={styles.label}>{label}</RNTesterText>
      <RNTesterText
        style={[styles.sample, fontFamily != null ? {fontFamily} : null]}
        onTextLayout={onTextLayout}>
        {text}
      </RNTesterText>
      <RNTesterText style={styles.metrics}>
        {metrics == null
          ? 'measuring...'
          : `asc ${metrics.ascender.toFixed(1)} / desc ${metrics.descender.toFixed(1)} / h ${metrics.height.toFixed(1)} px`}
      </RNTesterText>
    </View>
  );
}

function sameMetrics(a: Metrics | null, b: Metrics | null): boolean {
  if (a == null || b == null) {
    return false;
  }
  return (
    Math.abs(a.ascender - b.ascender) < EPSILON &&
    Math.abs(a.descender - b.descender) < EPSILON &&
    Math.abs(a.height - b.height) < EPSILON
  );
}

function Playground(): React.Node {
  const [explicit, setExplicit] = React.useState<Metrics | null>(null);
  const [plain1, setPlain1] = React.useState<Metrics | null>(null);
  const [plain2, setPlain2] = React.useState<Metrics | null>(null);

  const done = plain1 != null && plain2 != null && explicit != null;
  const leaked = done && sameMetrics(plain1, explicit) && sameMetrics(plain2, explicit);

  return (
    <View style={styles.container}>
      <Sample label='R1 <Text fontFamily="casual">' fontFamily="casual" text="Dazzle" onMetrics={setExplicit} />
      <Sample label="R2 plain <Text> (different string)" text="Winter" onMetrics={setPlain1} />
      <Sample label="R3 plain <Text> (different string)" text="Rocket" onMetrics={setPlain2} />
      <RNTesterText style={[styles.verdict, leaked ? styles.bad : styles.good]}>
        {!done
          ? 'measuring...'
          : leaked
            ? 'REPRODUCED: the plain rows are measured with the "casual" font metrics, i.e. the shared TextPaint did not restore the typeface.'
            : 'NOT AFFECTED: the plain rows use the default font metrics, different from the explicit "casual" metrics.'}
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {padding: 10},
  row: {marginBottom: 12},
  label: {fontSize: 12},
  sample: {fontSize: FONT_SIZE},
  metrics: {fontSize: 12, color: '#666'},
  verdict: {fontSize: 14, marginTop: 8, fontWeight: 'bold'},
  bad: {color: '#c00'},
  good: {color: '#080'},
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
