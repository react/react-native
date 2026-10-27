/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/* global console: writable */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {Root, RootConfig} from '@react-native/fantom';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Dimensions, PixelRatio, View, useWindowDimensions} from 'react-native';

let roots: Array<Root>;
let originalConsole: typeof console;
let warn: JestMockFn<Array<unknown>, void>;

beforeEach(() => {
  roots = [];
  originalConsole = console;
  warn = jest.fn();
  console = Object.create(originalConsole, {warn: {value: warn}});
});

afterEach(() => {
  for (const root of roots) {
    Fantom.runTask(() => root.render(<></>));
    root.destroy();
  }
  console = originalConsole;
});

function createRoot(config?: RootConfig): Root {
  const root = Fantom.createRoot(config);
  roots.push(root);
  return root;
}

component WindowMetrics() {
  const {width, height, scale, fontScale} = useWindowDimensions();
  return <View testID={`${width}x${height}@${scale}:${fontScale}`} />;
}

it('uses root defaults before any root is created', () => {
  for (const dimension of ['window', 'screen']) {
    const metrics = Dimensions.get(dimension);
    expect(metrics.width).toBe(390);
    expect(metrics.height).toBe(844);
    expect(metrics.scale).toBe(3);
    expect(metrics.fontScale).toBe(1);
  }
  expect(PixelRatio.get()).toBe(3);
  expect(PixelRatio.getFontScale()).toBe(1);
});

it('sets default window and screen metrics', () => {
  createRoot();
  for (const dimension of ['window', 'screen']) {
    const metrics = Dimensions.get(dimension);
    expect(metrics.width).toBe(390);
    expect(metrics.height).toBe(844);
    expect(metrics.scale).toBe(3);
    expect(metrics.fontScale).toBe(1);
  }
});

it('sets custom viewport, pixel ratio, and font scale', () => {
  createRoot({
    viewportWidth: 640,
    viewportHeight: 480,
    devicePixelRatio: 2,
    fontScale: 1.5,
  });
  for (const dimension of ['window', 'screen']) {
    const metrics = Dimensions.get(dimension);
    expect(metrics.width).toBe(640);
    expect(metrics.height).toBe(480);
    expect(metrics.scale).toBe(2);
    expect(metrics.fontScale).toBe(1.5);
  }
  expect(PixelRatio.get()).toBe(2);
  expect(PixelRatio.getFontScale()).toBe(1.5);
});

it('does not warn for matching metrics, including different viewport offsets', () => {
  createRoot();
  createRoot({viewportOffsetX: 20, viewportOffsetY: 90});
  expect(warn).not.toHaveBeenCalled();
});

const conflictingConfigs: Array<[string, RootConfig]> = [
  ['width', {viewportWidth: 402}],
  ['height', {viewportHeight: 874}],
  ['pixel ratio', {devicePixelRatio: 2}],
  ['font scale', {fontScale: 1.5}],
];

for (const [name, config] of conflictingConfigs) {
  it(`warns and applies new metrics when an active root has a different ${name}`, () => {
    createRoot();
    createRoot(config);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('another active root');
    const metrics = Dimensions.get('window');
    expect(metrics.width).toBe(config.viewportWidth ?? 390);
    expect(metrics.height).toBe(config.viewportHeight ?? 844);
    expect(metrics.scale).toBe(config.devicePixelRatio ?? 3);
    expect(metrics.fontScale).toBe(config.fontScale ?? 1);
  });
}

it('compares new metrics only with the current global dimensions', () => {
  createRoot();
  createRoot({viewportWidth: 640});
  createRoot({viewportWidth: 640});
  expect(warn).toHaveBeenCalledTimes(1);
  expect(Dimensions.get('window').width).toBe(640);
  createRoot();
  expect(warn).toHaveBeenCalledTimes(2);
  expect(Dimensions.get('window').width).toBe(390);
});

it('does not warn for a destroyed root', () => {
  const first = createRoot();
  first.destroy();
  roots.shift();
  createRoot({viewportWidth: 640});
  expect(warn).not.toHaveBeenCalled();
});

it('restores the latest surviving root and then defaults when all roots are destroyed', () => {
  const first = createRoot();
  const second = createRoot({
    viewportWidth: 640,
    viewportHeight: 480,
    devicePixelRatio: 2,
    fontScale: 1.5,
  });
  const third = createRoot({viewportWidth: 900});
  third.destroy();
  roots.pop();
  for (const dimension of ['window', 'screen']) {
    const metrics = Dimensions.get(dimension);
    expect(metrics.width).toBe(640);
    expect(metrics.height).toBe(480);
    expect(metrics.scale).toBe(2);
    expect(metrics.fontScale).toBe(1.5);
  }
  first.destroy();
  roots.shift();
  for (const dimension of ['window', 'screen']) {
    const metrics = Dimensions.get(dimension);
    expect(metrics.width).toBe(640);
    expect(metrics.height).toBe(480);
    expect(metrics.scale).toBe(2);
    expect(metrics.fontScale).toBe(1.5);
  }
  second.destroy();
  roots.pop();
  for (const dimension of ['window', 'screen']) {
    const metrics = Dimensions.get(dimension);
    expect(metrics.width).toBe(390);
    expect(metrics.height).toBe(844);
    expect(metrics.scale).toBe(3);
    expect(metrics.fontScale).toBe(1);
  }
  expect(PixelRatio.get()).toBe(3);
  expect(PixelRatio.getFontScale()).toBe(1);
});

it('notifies mounted components when another root changes the metrics', () => {
  const first = createRoot();
  Fantom.runTask(() => first.render(<WindowMetrics />));
  expect(first.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
    <rn-view testID="390x844@3:1" />,
  );
  const second = createRoot({
    viewportWidth: 640,
    viewportHeight: 480,
    devicePixelRatio: 2,
    fontScale: 1.5,
  });
  Fantom.runTask(() => second.render(<WindowMetrics />));
  expect(warn).toHaveBeenCalledTimes(1);
  for (const root of [first, second]) {
    expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
      <rn-view testID="640x480@2:1.5" />,
    );
  }
  Fantom.runTask(() => second.render(<></>));
  second.destroy();
  roots.pop();
  Fantom.runWorkLoop();
  expect(first.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
    <rn-view testID="390x844@3:1" />,
  );
});
