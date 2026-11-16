/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {Root, RootConfig} from '@react-native/fantom';
import type {HostInstance, ScrollViewInstance} from 'react-native';

import RuntimeVersion from '../../../../packages/new-app-screen/src/RuntimeVersion';
import FeedScreen from './fixtures/FeedScreen';
import TravelScreen from './fixtures/TravelScreen';
import * as Fantom from '@react-native/fantom';
import {NewAppScreen} from '@react-native/new-app-screen';
import * as React from 'react';
import {createRef} from 'react';

const rootConfig: RootConfig = {
  viewportWidth: 402,
  viewportHeight: 874,
  devicePixelRatio: 3,
};

describe('Fantom screen snapshots', () => {
  let root: Root;
  const hermesVersion = RuntimeVersion.hermes;

  beforeEach(() => {
    RuntimeVersion.hermes = '';
    root = Fantom.createRoot(rootConfig);
  });

  afterEach(() => {
    RuntimeVersion.hermes = hermesVersion;
    root.destroy();
  });

  it('captures the default New App Screen', () => {
    Fantom.runTask(() => root.render(<NewAppScreen />));
    expect(root.takeScreenshot()).toMatchSnapshot();
  });

  it('captures the travel screen, entered text, and scrolling', () => {
    const scrollRef = createRef<ScrollViewInstance>();
    Fantom.runTask(() => root.render(<TravelScreen scrollRef={scrollRef} />));
    expect(root.takeScreenshot()).toMatchSnapshot();
    Fantom.runTask(() =>
      root.render(<TravelScreen query="Mountains" scrollRef={scrollRef} />),
    );
    expect(root.takeScreenshot()).toMatchSnapshot('entered text');
    Fantom.scrollTo(scrollRef, {x: 0, y: 180});
    expect(root.takeScreenshot()).toMatchSnapshot('scrolled');
  });

  it('captures the feed and its scrolled viewport', () => {
    const feedRef = createRef<HostInstance>();
    Fantom.runTask(() => root.render(<FeedScreen feedRef={feedRef} />));
    const initial = root.takeScreenshot();
    expect(initial).toMatchSnapshot();
    Fantom.scrollTo(feedRef, {x: 0, y: 360});
    expect(root.takeScreenshot()).toMatchSnapshot('scrolled');
    Fantom.scrollTo(feedRef, {x: 0, y: 0});
    expect(root.takeScreenshot().isEqual(initial)).toBe(true);
  });
});
