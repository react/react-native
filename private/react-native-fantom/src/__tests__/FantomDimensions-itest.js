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
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
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

it('updates font scale and notifies mounted components without changing other metrics', () => {
  const root = createRoot({
    viewportWidth: 640,
    viewportHeight: 480,
    devicePixelRatio: 2,
    viewportOffsetX: 10,
    viewportOffsetY: 20,
  });
  Fantom.runTask(() => root.render(<WindowMetrics />));

  const previousDimensions = Dimensions.get('window');

  root.updateSurfaceConstraints({fontScale: 1.5});

  expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
    <rn-view testID="640x480@2:1.5" />,
  );
  for (const dimension of ['window', 'screen']) {
    expect(Dimensions.get(dimension)).toEqual({
      width: 640,
      height: 480,
      scale: 2,
      fontScale: 1.5,
    });
  }
  expect(previousDimensions.fontScale).toBe(1);
  expect(PixelRatio.get()).toBe(2);
  expect(PixelRatio.getFontScale()).toBe(1.5);
});

it('updates native constraints on the UI thread before running JavaScript', () => {
  const root = createRoot({
    viewportWidth: 120,
    viewportHeight: 140,
    devicePixelRatio: 2,
  });
  const viewRef = createRef<HostInstance>();
  Fantom.runTask(() => {
    root.render(
      <View
        ref={viewRef}
        collapsable={false}
        style={{width: '100%', height: '100%'}}>
        <WindowMetrics />
      </View>,
    );
  });
  const view = nullthrows(viewRef.current);
  const previousDimensions = Dimensions.get('window');
  const changes = jest.fn();
  const subscription = Dimensions.addEventListener('change', changes);

  try {
    Fantom.runOnUIThread(() => {
      root.enqueueUpdateSurfaceConstraints({
        viewportWidth: 200,
        viewportHeight: 240,
        devicePixelRatio: 4,
        fontScale: 1.5,
        viewportOffsetX: 25,
        viewportOffsetY: 35,
      });
    });

    const bounds = view.getBoundingClientRect();
    expect(bounds.x).toBe(25);
    expect(bounds.y).toBe(35);
    expect(bounds.width).toBe(200);
    expect(bounds.height).toBe(240);
    expect(Dimensions.get('window')).toBe(previousDimensions);
    expect(changes).not.toHaveBeenCalled();
    expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
      <rn-view>
        <rn-view testID="120x140@2:1" />
      </rn-view>,
    );

    Fantom.runWorkLoop();

    expect(changes).toHaveBeenCalledTimes(1);
    expect(Dimensions.get('window')).toEqual({
      width: 200,
      height: 240,
      scale: 4,
      fontScale: 1.5,
    });
    expect(previousDimensions).toEqual({
      width: 120,
      height: 140,
      scale: 2,
      fontScale: 1,
    });
    expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
      <rn-view>
        <rn-view testID="200x240@4:1.5" />
      </rn-view>,
    );
    expect(viewRef.current).toBe(view);
  } finally {
    subscription.remove();
  }
});

it('updates constraints within an existing JavaScript task without nesting the work loop', () => {
  const root = createRoot({viewportWidth: 120, viewportHeight: 140});
  Fantom.runTask(() => root.render(<WindowMetrics />));

  Fantom.runTask(() => {
    root.updateSurfaceConstraints({viewportWidth: 200, fontScale: 1.5});
    expect(Dimensions.get('window').width).toBe(120);
  });

  expect(Dimensions.get('window')).toEqual({
    width: 200,
    height: 140,
    scale: 3,
    fontScale: 1.5,
  });
  expect(root.getRenderedOutput({props: ['testID']}).toJSX()).toEqual(
    <rn-view testID="200x140@3:1.5" />,
  );
});

it('merges queued partial updates without losing earlier native changes', () => {
  const root = createRoot({
    viewportWidth: 120,
    viewportHeight: 140,
    devicePixelRatio: 2,
  });
  const changes: Array<string> = [];
  const subscription = Dimensions.addEventListener('change', ({window}) => {
    changes.push(
      `${window.width}x${window.height}@${window.scale}:${window.fontScale}`,
    );
  });

  try {
    Fantom.runOnUIThread(() => {
      root.enqueueUpdateSurfaceConstraints({viewportWidth: 210});
      root.enqueueUpdateSurfaceConstraints({fontScale: 1.75});
    });
    expect(changes).toEqual([]);

    Fantom.runWorkLoop();

    expect(changes).toEqual(['210x140@2:1', '210x140@2:1.75']);
    expect(Dimensions.get('window')).toEqual({
      width: 210,
      height: 140,
      scale: 2,
      fontScale: 1.75,
    });
  } finally {
    subscription.remove();
  }
});

it('applies pixel-ratio changes to native layout rounding', () => {
  const root = createRoot({devicePixelRatio: 2});
  const viewRef = createRef<HostInstance>();
  Fantom.runTask(() => {
    root.render(<View ref={viewRef} style={{width: 10.25, height: 20.25}} />);
  });
  const view = nullthrows(viewRef.current);
  expect(view.getBoundingClientRect().width).toBe(10.5);
  expect(view.getBoundingClientRect().height).toBe(20.5);

  root.updateSurfaceConstraints({devicePixelRatio: 4});

  expect(view.getBoundingClientRect().width).toBe(10.25);
  expect(view.getBoundingClientRect().height).toBe(20.25);
  expect(PixelRatio.get()).toBe(4);
});

it('updates existing dimensions without changing root creation order', () => {
  const first = createRoot({viewportWidth: 100});
  const second = createRoot({viewportWidth: 200});
  const third = createRoot({viewportWidth: 300});
  expect(warn).toHaveBeenCalledTimes(2);

  first.updateSurfaceConstraints({viewportWidth: 400});

  expect(warn).toHaveBeenCalledTimes(2);
  third.destroy();
  roots.pop();
  expect(Dimensions.get('window').width).toBe(200);
  second.destroy();
  roots.pop();
  expect(Dimensions.get('window').width).toBe(400);
  first.destroy();
  roots.pop();
  expect(Dimensions.get('window').width).toBe(390);
});

it('does not restore dimensions from a queued update after root destruction', () => {
  const root = createRoot({viewportWidth: 640});
  Fantom.runOnUIThread(() => {
    root.enqueueUpdateSurfaceConstraints({viewportWidth: 900});
  });

  root.destroy();
  roots.pop();

  expect(Dimensions.get('window').width).toBe(390);
  expect(() =>
    root.enqueueUpdateSurfaceConstraints({viewportWidth: 900}),
  ).toThrow('Cannot update the constraints of a destroyed root.');
  createRoot();
  expect(warn).not.toHaveBeenCalled();
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
