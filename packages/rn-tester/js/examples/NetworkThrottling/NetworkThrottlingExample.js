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
 * NetworkThrottlingExample
 * ------------------------
 * Validates the two properties of `Network.emulateNetworkConditions` that
 * matter most: `latency` and `downloadThroughput`.
 *
 * Throttling is set in DevTools; this screen is the observer. It loads a small
 * grid of images concurrently over XHR and reports:
 *
 *   Latency mode     — tiny payloads, so duration ≈ latency. Every request's
 *                      TTFB should be at least the preset's latency.
 *   Throughput mode  — large payloads, so duration ≈ bytes / throughput.
 *                      Effective rate should land on the preset's figure.
 *
 * Both modes also make the fair-share behaviour visible for free: Chrome splits
 * bandwidth evenly, round-robin, across in-flight requests, so the bars advance
 * in lockstep and the tiles finish together rather than one after another.
 *
 * Endpoint: https://picsum.photos — public, auth-free, real JPEGs.
 */

import type {
  RNTesterModule,
  RNTesterModuleExample,
} from '../../types/RNTesterTypes';

import * as React from 'react';
import {useCallback, useEffect, useReducer, useRef, useState} from 'react';
import {Image, Platform, Pressable, StyleSheet, Text, View} from 'react-native';

const PICSUM = 'https://picsum.photos';

/**
 * Concurrency. Platforms cap requests per host (NSURLSession ~4; OkHttp's
 * Dispatcher 5), so above ~4 the grid loads in waves and the fair-share
 * behaviour stops being legible. That's the client, not the throttler.
 */
const COUNT = 4;

/**
 * Progress events arrive roughly every 1.5 kB once throttling is on (Chrome
 * clamps reads to one 1500-byte packet), so a 200 kB image fires ~130 of them.
 * Setting state per event would make the JS thread — not the throttler — the
 * bottleneck and corrupt the measurement. Buffer in refs, flush on a timer.
 */
const FLUSH_MS = 100;

type Mode = {
  key: 'latency' | 'throughput',
  label: string,
  px: number,
  blurb: string,
};

const MODES: Mode[] = [
  {
    key: 'latency',
    label: 'Latency',
    px: 48,
    blurb:
      'Near-empty payloads, so bytes are irrelevant. Each request should take at least the preset latency.',
  },
  {
    key: 'throughput',
    label: 'Download throughput',
    px: 1200,
    blurb:
      'Large payloads. Bandwidth is shared evenly across the 4 requests, so they should all land at ~latency + (total bytes / throughput).',
  },
];

type Req = {
  id: string,
  url: string,
  label: string,
  startedAt: number,
  /** Response headers received — where Chrome releases the latency-suspended
   * record, so this is the number `latency` is supposed to govern. */
  ttfbAt: number | null,
  doneAt: number | null,
  loaded: number,
  total: number,
  error: string | null,
  running: boolean,
};

type Run = {startedAt: number, endedAt: number | null, reqs: Req[]};

/** Fresh cache-buster per run. Without it, every run after the first is served
 * from cache and the demo is a lie. (`Network.setCacheDisabled` is not wired
 * up in RN, so we cannot rely on the DevTools "Disable cache" checkbox.) */
const bust = () => Math.random().toString(36).slice(2, 8);

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} kB`;
const secs = (ms: number) => `${(ms / 1000).toFixed(2)} s`;
const rate = (bps: number) => `${(bps / 1024).toFixed(0)} kB/s`;

function NetworkThrottling() {
  const [mode, setMode] = useState(MODES[0]);
  const [, forceRender] = useReducer<number, void>((c: number) => c + 1, 0);

  const runRef = useRef<Run | null>(null);
  const xhrsRef = useRef<XMLHttpRequest[]>([]);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancel = useCallback(() => {
    xhrsRef.current.forEach(xhr => xhr.abort());
    xhrsRef.current = [];
    if (flushRef.current != null) {
      clearInterval(flushRef.current);
      flushRef.current = null;
    }
  }, []);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(() => {
    cancel();

    const seed = bust();
    const startedAt = Date.now();
    const run: Run = {
      startedAt,
      endedAt: null,
      reqs: Array.from({length: COUNT}, (_, i) => ({
        id: `${seed}-${i}`,
        label: `#${i + 1}`,
        url: `${PICSUM}/seed/${seed}-${i}/${mode.px}/${mode.px}?random=${seed}${i}`,
        startedAt,
        ttfbAt: null,
        doneAt: null,
        loaded: 0,
        total: 0,
        error: null,
        running: true,
      })),
    };
    runRef.current = run;

    const settle = () => {
      if (run.reqs.every(r => !r.running)) {
        run.endedAt = Date.now();
        cancel();
        forceRender();
      }
    };

    run.reqs.forEach(req => {
      const xhr = new XMLHttpRequest();
      xhrsRef.current.push(xhr);

      xhr.open('GET', req.url);
      // We only want the byte counts, never the payload — `blob` keeps the
      // bytes native-side rather than decoding a JPEG into a JS string.
      xhr.responseType = 'blob';

      // NB: RN only requests incremental (progress) events from native when
      // `onprogress` or `onreadystatechange` is assigned *before* send().
      xhr.onreadystatechange = () => {
        if (xhr.readyState === xhr.HEADERS_RECEIVED && req.ttfbAt == null) {
          req.ttfbAt = Date.now();
        }
      };
      xhr.onprogress = (event: ProgressEvent) => {
        req.loaded = event.loaded;
        if (event.lengthComputable) {
          req.total = event.total;
        }
      };
      xhr.onload = () => {
        req.running = false;
        req.doneAt = Date.now();
        if (xhr.status >= 400) {
          req.error = `HTTP ${xhr.status}`;
        }
        // Release the native blob rather than waiting for GC.
        const blob: {close?: () => void} | null = xhr.response;
        blob?.close?.();
        settle();
      };
      const fail = (message: string) => () => {
        if (!req.running) {
          return;
        }
        req.running = false;
        req.doneAt = Date.now();
        req.error = message;
        settle();
      };
      xhr.onerror = fail('Network request failed');
      xhr.ontimeout = fail('Timed out');
      xhr.onabort = fail('Aborted');

      xhr.send();
    });

    flushRef.current = setInterval(forceRender, FLUSH_MS);
    forceRender();
  }, [cancel, mode]);

  const run = runRef.current;
  const running = run != null && run.endedAt == null;

  return (
    <View style={styles.root}>
      <Text style={styles.hint}>
        Set a throttling preset in the DevTools Network panel, then run. The app
        can't read the active CDP conditions itself, so compare the timings
        below against the preset you picked.
      </Text>

      <Text style={styles.heading}>What to measure</Text>
      <View style={styles.row}>
        {MODES.map(m => (
          <Chip
            key={m.key}
            label={m.label}
            active={m.key === mode.key}
            onPress={() => setMode(m)}
          />
        ))}
      </View>
      <Text style={styles.hint}>{mode.blurb}</Text>

      <Pressable
        onPress={start}
        disabled={running}
        style={({pressed}) => [
          styles.button,
          (pressed || running) && styles.buttonDim,
        ]}>
        <Text style={styles.buttonLabel}>
          {running ? 'Loading…' : `Load ${COUNT} images`}
        </Text>
      </Pressable>

      {run != null ? (
        <>
          <View style={styles.grid}>
            {run.reqs.map(req => (
              <Tile key={req.id} req={req} />
            ))}
          </View>
          <Summary run={run} mode={mode} />
        </>
      ) : null}
    </View>
  );
}

function Tile({req}: {req: Req}) {
  const pct =
    req.total > 0 ? Math.min(1, req.loaded / req.total) : req.running ? 0 : 1;
  const elapsed = (req.doneAt ?? Date.now()) - req.startedAt;

  return (
    <View style={styles.tile}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {width: `${pct * 100}%`},
            req.error != null && styles.fillError,
          ]}
        />
      </View>
      <View style={styles.imageWrap}>
        {/* Rendered only once the measured request has finished, so the image
            pipeline's own fetch never competes for bandwidth during the window
            we're measuring. */}
        {req.doneAt != null && req.error == null ? (
          <Image
            source={{uri: req.url}}
            style={styles.image}
            resizeMode="cover"
          />
        ) : null}
      </View>
      <Text style={styles.tileLabel}>{req.label}</Text>
      <Text style={styles.mono}>
        {req.error ??
          `${kb(req.loaded)}${req.total > 0 ? ` / ${kb(req.total)}` : ''}`}
      </Text>
      <Text style={styles.monoDim}>
        {req.ttfbAt != null
          ? `ttfb ${secs(req.ttfbAt - req.startedAt)} · ${secs(elapsed)}`
          : 'waiting…'}
      </Text>
    </View>
  );
}

function Summary({run, mode}: {run: Run, mode: Mode}) {
  const end = run.endedAt ?? Date.now();
  const wallMs = end - run.startedAt;
  const totalBytes = run.reqs.reduce((sum, r) => sum + r.loaded, 0);
  const effectiveBps = wallMs > 0 ? (totalBytes / wallMs) * 1000 : 0;

  const ttfbs = run.reqs
    .filter(r => r.ttfbAt != null)
    .map(r => (r.ttfbAt ?? 0) - r.startedAt);
  const minTtfb = ttfbs.length > 0 ? Math.min(...ttfbs) : null;

  const completions = run.reqs
    .filter(r => r.doneAt != null)
    .map(r => (r.doneAt ?? 0) - run.startedAt);
  const spread =
    completions.length > 1
      ? Math.max(...completions) - Math.min(...completions)
      : 0;

  return (
    <View style={styles.card}>
      {mode.key === 'latency' && minTtfb != null ? (
        <Row
          k="Fastest TTFB"
          hint="Should be at least the preset latency"
          v={secs(minTtfb)}
        />
      ) : null}

      {mode.key === 'throughput' ? (
        <Row
          k="Effective rate"
          hint="Should land on the preset download throughput"
          v={rate(effectiveBps)}
        />
      ) : null}

      <Row k="Wall time" v={secs(wallMs)} />
      <Row k="Bytes" v={kb(totalBytes)} />
      <Row
        k="Completion spread"
        hint="Round-robin fair share ⇒ near zero for equal payloads"
        v={secs(spread)}
      />
    </View>
  );
}

function Row({k, v, hint}: {k: string, v: string, hint?: string}) {
  return (
    <View style={styles.summaryRow}>
      <View style={styles.summaryKey}>
        <Text style={styles.label}>{k}</Text>
        {hint != null ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      <Text style={styles.mono}>{v}</Text>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string,
  active: boolean,
  onPress: () => void,
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24},
  heading: {fontWeight: '600', fontSize: 13, marginTop: 8},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  hint: {fontSize: 11, color: '#6b6b70', lineHeight: 15},
  label: {fontSize: 13},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12},
  tile: {
    width: '47%',
    gap: 2,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f2f2f7',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d8d8de',
    overflow: 'hidden',
  },
  fill: {height: 8, backgroundColor: '#0b6cf5'},
  fillError: {backgroundColor: '#c2261a'},
  imageWrap: {
    width: '100%',
    height: 88,
    borderRadius: 4,
    marginTop: 6,
    overflow: 'hidden',
    backgroundColor: '#d8d8de',
  },
  image: {width: '100%', height: '100%'},
  tileLabel: {fontWeight: '600', fontSize: 12, marginTop: 4},
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c7c7cc',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryKey: {flexShrink: 1},
  mono: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  monoDim: {
    fontSize: 11,
    color: '#6b6b70',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: '#0b6cf5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  buttonDim: {opacity: 0.5},
  buttonLabel: {color: 'white', fontWeight: '600'},
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f2f2f7',
  },
  chipActive: {backgroundColor: '#0b6cf5'},
  chipLabel: {fontSize: 12, color: '#1c1c1e'},
  chipLabelActive: {color: 'white', fontWeight: '600'},
});

const examples: RNTesterModuleExample[] = [
  {
    title: 'Latency and download throughput',
    name: 'throttling',
    scrollable: true,
    description:
      'Loads 4 images concurrently and reports TTFB and the aggregate download rate.',
    render: () => <NetworkThrottling />,
  },
];

export default {
  title: 'Network Throttling',
  category: 'Basic',
  documentationURL: 'https://reactnative.dev/docs/react-native-devtools',
  description:
    'Validates Network.emulateNetworkConditions (latency, downloadThroughput).',
  examples,
} as RNTesterModule;
