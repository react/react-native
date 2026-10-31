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

import FeedScreen from './fixtures/FeedScreen';
import TravelScreen from './fixtures/TravelScreen';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef, useState} from 'react';
import {ScrollView, Text, TextInput, View} from 'react-native';

component ScrollableInputs(
  scrollRef: React.RefObject<HostInstance | null>,
  nameRef: React.RefObject<HostInstance | null>,
  notesRef: React.RefObject<HostInstance | null>,
  scrollHeight?: number,
) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <View style={{flex: 1, padding: 20, gap: 8}}>
      <Text>Fixed heading</Text>
      <ScrollView
        ref={scrollRef}
        style={
          scrollHeight == null
            ? {flex: 1}
            : {height: scrollHeight, flexGrow: 0, flexShrink: 0}
        }>
        <View style={{height: 600, backgroundColor: 'skyblue'}} />
        <View style={{height: 600, backgroundColor: 'orange'}} />
      </ScrollView>
      <TextInput
        ref={nameRef}
        value={name}
        onChangeText={setName}
        placeholder="Name"
        style={{height: 44, backgroundColor: 'white'}}
      />
      <TextInput
        ref={notesRef}
        value={notes}
        onChangeText={setNotes}
        placeholder="Notes"
        multiline
        style={{height: 72, backgroundColor: 'white'}}
      />
    </View>
  );
}

let roots: Array<Root>;

beforeEach(() => {
  roots = [];
});

afterEach(() => {
  for (const root of roots) {
    root.destroy();
  }
});

function createRoot(config: RootConfig): Root {
  const root = Fantom.createRoot(config);
  roots.push(root);
  return root;
}

describe('Fantom root images', () => {
  it('captures a screen, its update, and its scrolled viewport', () => {
    const root = createRoot({
      devicePixelRatio: 1,
    });
    const scrollRef = createRef<ScrollViewInstance>();
    Fantom.runTask(() => root.render(<TravelScreen scrollRef={scrollRef} />));
    const before = root.takeScreenshot();
    Fantom.runTask(() =>
      root.render(<TravelScreen query="Mountains" scrollRef={scrollRef} />),
    );
    const after = root.takeScreenshot();
    expect(after.isEqual(before)).toBe(false);
    Fantom.scrollTo(scrollRef, {x: 0, y: 180});
    expect(root.takeScreenshot().isEqual(after)).toBe(false);
  });

  it('captures the mounted revision without flushing pending work', () => {
    const root = createRoot({
      viewportWidth: 20,
      viewportHeight: 10,
      devicePixelRatio: 2,
    });
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'red'}} />),
    );
    Fantom.scheduleTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'blue'}} />),
    );
    const pending = root.takeScreenshot();
    expect(
      root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
    ).toEqual(<rn-view backgroundColor="rgba(255, 0, 0, 1)" />);
    Fantom.runWorkLoop();
    expect(root.takeScreenshot().isEqual(pending)).toBe(false);
  });

  it('captures the feed and restores its initial scroll position', () => {
    const root = createRoot({
      viewportWidth: 402,
      viewportHeight: 874,
      devicePixelRatio: 1,
    });
    const feedRef = createRef<HostInstance>();

    Fantom.runTask(() => root.render(<FeedScreen feedRef={feedRef} />));
    const feed = nullthrows(feedRef.current);
    const bounds = feed.getBoundingClientRect();
    expect(bounds.y).toBeGreaterThan(0);
    expect(bounds.bottom).toBeLessThan(874);
    expect(feed.scrollHeight).toBeGreaterThan(bounds.height + 360);

    const before = root.takeScreenshot();

    Fantom.scrollTo(feedRef, {x: 0, y: 360});
    expect(feed.scrollTop).toBe(360);
    expect(feed.getBoundingClientRect().y).toBe(bounds.y);

    expect(root.takeScreenshot().isEqual(before)).toBe(false);

    Fantom.scrollTo(feedRef, {x: 0, y: 0});
    expect(root.takeScreenshot().isEqual(before)).toBe(true);
  });

  for (const scrollHeight of [undefined, 400]) {
    const viewport =
      scrollHeight == null ? 'remaining screen' : 'inset viewport';
    it(`captures entered text and scrolling in the ${viewport}`, () => {
      const root = createRoot({
        viewportWidth: 402,
        viewportHeight: 874,
        devicePixelRatio: 1,
      });
      const scrollRef = createRef<HostInstance>();
      const nameRef = createRef<HostInstance>();
      const notesRef = createRef<HostInstance>();

      Fantom.runTask(() =>
        root.render(
          <ScrollableInputs
            scrollRef={scrollRef}
            nameRef={nameRef}
            notesRef={notesRef}
            scrollHeight={scrollHeight}
          />,
        ),
      );
      expect(nullthrows(scrollRef.current).scrollTop).toBe(0);
      const scrollBounds = nullthrows(
        scrollRef.current,
      ).getBoundingClientRect();
      expect(nullthrows(scrollRef.current).scrollHeight).toBeGreaterThan(
        scrollBounds.height + 240,
      );
      if (scrollHeight != null) {
        expect(scrollBounds.height).toBe(scrollHeight);
        expect(scrollBounds.x).toBe(20);
        expect(scrollBounds.width).toBe(362);
        expect(scrollBounds.y).toBeGreaterThan(0);
        expect(scrollBounds.bottom).toBeLessThan(874);
      }

      const before = root.takeScreenshot();

      Fantom.dispatchNativeEvent(nameRef, 'change', {
        text: 'Ada Lovelace',
        eventCount: 1,
      });
      const name = root.takeScreenshot();
      expect(name.isEqual(before)).toBe(false);

      Fantom.dispatchNativeEvent(notesRef, 'change', {
        text: 'Build my first screen.\nExplore the learning links.',
        eventCount: 1,
      });
      const inputs = root.takeScreenshot();
      expect(inputs.isEqual(name)).toBe(false);

      const inputBounds = nullthrows(nameRef.current).getBoundingClientRect();
      Fantom.scrollTo(scrollRef, {x: 0, y: 240});
      expect(nullthrows(scrollRef.current).scrollTop).toBe(240);
      expect(nullthrows(scrollRef.current).getBoundingClientRect().y).toBe(
        scrollBounds.y,
      );
      expect(nullthrows(nameRef.current).getBoundingClientRect().y).toBe(
        inputBounds.y,
      );

      expect(root.takeScreenshot().isEqual(inputs)).toBe(false);

      Fantom.scrollTo(scrollRef, {x: 0, y: 0});
      expect(root.takeScreenshot().isEqual(inputs)).toBe(true);
    });
  }

  it('rejects screenshot capture after root destruction', () => {
    const root = Fantom.createRoot({
      viewportWidth: 8,
      viewportHeight: 4,
      devicePixelRatio: 1,
    });
    Fantom.runTask(() => root.render(<View />));
    root.destroy();
    expect(() => root.takeScreenshot()).toThrow(
      'Cannot capture a screenshot of a destroyed root.',
    );
  });
});
