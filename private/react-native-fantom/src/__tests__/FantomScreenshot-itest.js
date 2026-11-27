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
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef, useState} from 'react';
import {Image, ScrollView, Text, TextInput, View} from 'react-native';

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

const rootConfig: RootConfig = {
  viewportWidth: 8,
  viewportHeight: 4,
  devicePixelRatio: 1,
};

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

describe('Fantom screenshot snapshots', () => {
  it('matches an inline screenshot hash', () => {
    const root = createRoot(rootConfig);
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'red'}} />),
    );
    expect(root.takeScreenshot()).toMatchInlineSnapshot(`
      Object {
        "hash": "7ce176afc63d276869ec36bb0ad16f57098496278cfa87967206be51e2752102",
        "type": "Screenshot",
      }
    `);
  });

  for (const devicePixelRatio of [3, 1, 1.5, 2]) {
    const title =
      'renders gray text, translucent layers and a resized image consistently';
    it(
      devicePixelRatio === 3
        ? title
        : `${title} at pixel ratio ${devicePixelRatio}`,
      () => {
        const root = createRoot({
          viewportWidth: 160,
          viewportHeight: 140,
          devicePixelRatio,
        });
        Fantom.runTask(() =>
          root.render(
            <View style={{flex: 1, backgroundColor: 'white'}}>
              <Text style={{fontSize: 17, color: '#808080'}}>
                Gray text 123
              </Text>
              <View
                style={{width: 100, height: 40, backgroundColor: '#3978b4'}}>
                <View
                  style={{
                    position: 'absolute',
                    left: 13.5,
                    top: 7.5,
                    width: 60,
                    height: 25,
                    opacity: 0.37,
                    backgroundColor: '#d05b39',
                    borderRadius: 5,
                  }}
                />
              </View>
              <Image
                source={require('../../../../packages/rn-tester/js/assets/bunny.png')}
                style={{width: 53, height: 47}}
                resizeMode="cover"
              />
            </View>,
          ),
        );
        expect(root.takeScreenshot()).toMatchSnapshot();
      },
    );
  }

  it('renders scaled text and inputs like equivalent explicit font sizes', () => {
    const config: RootConfig = {
      viewportWidth: 256,
      viewportHeight: 200,
      devicePixelRatio: 1,
    };
    const unscaled = createRoot(config);
    const scaled = createRoot({...config, fontScale: 2});
    const elements = (fontSize: number, lineHeight: number) => (
      <View style={{flex: 1, backgroundColor: 'white'}}>
        <Text style={{fontSize, lineHeight}}>Fantom</Text>
        <TextInput style={{fontSize, lineHeight}} value="Input" />
        <TextInput style={{fontSize, lineHeight}} placeholder="Placeholder" />
      </View>
    );
    Fantom.runTask(() => {
      unscaled.render(elements(16, 24));
      scaled.render(elements(16, 24));
    });
    const screenshot = scaled.takeScreenshot();
    const unscaledScreenshot = unscaled.takeScreenshot();
    expect(unscaledScreenshot).toMatchSnapshot('fontScale 1');
    expect(screenshot).toMatchSnapshot('fontScale 2');
    expect(screenshot.isEqual(unscaledScreenshot)).toBe(false);
    Fantom.runTask(() => unscaled.render(elements(32, 48)));
    expect(screenshot.isEqual(unscaled.takeScreenshot())).toBe(true);
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

  it('captures a mounted root and its update', () => {
    const root = createRoot(rootConfig);
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'red'}} />),
    );
    const screenshot = root.takeScreenshot();
    expect(screenshot).toMatchSnapshot();
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'blue'}} />),
    );
    expect(root.takeScreenshot()).toMatchSnapshot('updated');
  });

  it('uses the same snapshot numbering for screenshots and other values', () => {
    const root = createRoot(rootConfig);
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'red'}} />),
    );
    expect('before screenshot').toMatchSnapshot();
    expect(root.takeScreenshot()).toMatchSnapshot('screen');
    expect('after screenshot').toMatchSnapshot();
  });

  it('retains pixels across root updates and destruction and compares dimensions', () => {
    const root = Fantom.createRoot(rootConfig);
    const smaller = Fantom.createRoot({...rootConfig, viewportWidth: 4});
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'red'}} />),
    );
    const red = root.takeScreenshot();
    const sameRed = root.takeScreenshot();
    expect(red.isEqual(sameRed)).toBe(true);
    expect(sameRed.isEqual(red)).toBe(true);
    expect(red.toJSON()).toEqual(sameRed.toJSON());
    Fantom.runTask(() =>
      root.render(<View style={{flex: 1, backgroundColor: 'blue'}} />),
    );
    const blue = root.takeScreenshot();
    expect(red.isEqual(blue)).toBe(false);
    expect(blue.isEqual(red)).toBe(false);
    expect(red.toJSON()).not.toEqual(blue.toJSON());
    Fantom.runTask(() =>
      smaller.render(<View style={{flex: 1, backgroundColor: 'red'}} />),
    );
    expect(red.isEqual(smaller.takeScreenshot())).toBe(false);
    root.destroy();
    smaller.destroy();
    expect(red.isEqual(sameRed)).toBe(true);
    expect(red).toMatchSnapshot('retained red');
    expect(blue).toMatchSnapshot('retained blue');
    expect(red.isEqual(blue)).toBe(false);
    expect(() => root.takeScreenshot()).toThrow(
      'Cannot capture a screenshot of a destroyed root.',
    );
    expect(() => expect(red).not.toMatchSnapshot()).toThrow(
      'Snapshot matchers cannot be used with not.',
    );
  });
});
