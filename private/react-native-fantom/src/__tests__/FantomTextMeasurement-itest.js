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

import type {HostInstance} from 'react-native';

import NativeFantom from '../../../../packages/react-native/src/private/testing/fantom/specs/NativeFantom';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import {createRef} from 'react';
import {Text, TextInput, View} from 'react-native';

describe('Fantom text measurement', () => {
  it('reports invalid font files', () => {
    expect(() => NativeFantom.registerFont('/missing/fantom-font.ttf')).toThrow(
      'Cannot register Fantom font: /missing/fantom-font.ttf',
    );
  });

  it('measures intrinsic text and input sizes', () => {
    const root = Fantom.createRoot();
    const textRef = createRef<HostInstance>();
    const inputRef = createRef<HostInstance>();
    const elements = (
      <View style={{alignItems: 'flex-start'}}>
        <Text ref={textRef}>Hello Fantom</Text>
        <TextInput ref={inputRef} value="Hello Fantom" />
      </View>
    );
    Fantom.runTask(() => root.render(elements));
    for (const ref of [textRef, inputRef]) {
      const bounds = nullthrows(ref.current).getBoundingClientRect();
      expect(bounds.width).toBeGreaterThan(40);
      expect(bounds.height).toBeGreaterThan(10);
    }
    root.destroy();
  });

  it('wraps text with a constrained width', () => {
    const root = Fantom.createRoot();
    const singleLineRef = createRef<HostInstance>();
    const wrappedRef = createRef<HostInstance>();
    const text = 'Fantom measures text across multiple lines.';
    Fantom.runTask(() =>
      root.render(
        <View style={{alignItems: 'flex-start'}}>
          <Text ref={singleLineRef}>{text}</Text>
          <Text ref={wrappedRef} style={{width: 80}}>
            {text}
          </Text>
        </View>,
      ),
    );
    const singleLine = nullthrows(
      singleLineRef.current,
    ).getBoundingClientRect();
    const wrapped = nullthrows(wrappedRef.current).getBoundingClientRect();
    expect(wrapped.width).toBe(80);
    expect(wrapped.height).toBeGreaterThan(singleLine.height);
    root.destroy();
  });

  it('scales text, input values, placeholders, and explicit line heights', () => {
    const sizes: Array<Array<{width: number, height: number}>> = [];
    for (const fontScale of [1, 2]) {
      const root = Fantom.createRoot({fontScale, devicePixelRatio: 4});
      const refs = Array.from({length: 4}, () => createRef<HostInstance>());
      const style = {fontSize: 16, lineHeight: 24};
      Fantom.runTask(() =>
        root.render(
          <View style={{alignItems: 'flex-start'}}>
            <Text ref={refs[0]} style={style}>
              Fantom
            </Text>
            <TextInput ref={refs[1]} style={style} value="Fantom" />
            <TextInput ref={refs[2]} style={style} placeholder="Fantom" />
            <TextInput
              ref={refs[3]}
              style={style}
              value={'Fantom\ntext'}
              multiline
            />
          </View>,
        ),
      );
      sizes.push(
        refs.map(ref => {
          const {width, height} = nullthrows(
            ref.current,
          ).getBoundingClientRect();
          return {width, height};
        }),
      );
      root.destroy();
    }
    sizes[0].forEach((size, index) => {
      expect(size.width).toBe(61);
      expect(size.height).toBe(index === 3 ? 48 : 24);
      expect(sizes[1][index].width).toBe(121.75);
      expect(sizes[1][index].height).toBe(index === 3 ? 96 : 48);
    });
  });

  it('respects scaling opt-outs and caps for text and inputs', () => {
    const root = Fantom.createRoot({fontScale: 2, devicePixelRatio: 4});
    const refs = Array.from({length: 6}, () => createRef<HostInstance>());
    const style = {fontSize: 16, lineHeight: 24};
    Fantom.runTask(() =>
      root.render(
        <View style={{alignItems: 'flex-start'}}>
          <Text ref={refs[0]} style={style} allowFontScaling={false}>
            Fantom
          </Text>
          <Text ref={refs[1]} style={style} maxFontSizeMultiplier={1.5}>
            Fantom
          </Text>
          <Text ref={refs[2]} style={style} maxFontSizeMultiplier={0}>
            Fantom
          </Text>
          <TextInput
            ref={refs[3]}
            style={style}
            value="Fantom"
            allowFontScaling={false}
          />
          <TextInput
            ref={refs[4]}
            style={style}
            value="Fantom"
            maxFontSizeMultiplier={1.5}
          />
          <TextInput
            ref={refs[5]}
            style={style}
            value="Fantom"
            maxFontSizeMultiplier={0}
          />
        </View>,
      ),
    );
    const sizes = refs.map(ref =>
      nullthrows(ref.current).getBoundingClientRect(),
    );
    for (const offset of [0, 3]) {
      expect(sizes[offset].height).toBe(24);
      expect(sizes[offset + 1].height).toBe(36);
      expect(sizes[offset + 2].height).toBe(48);
      expect(sizes[offset + 1].width).toBeCloseTo(sizes[offset].width * 1.5, 0);
      expect(sizes[offset + 2].width).toBeCloseTo(sizes[offset].width * 2, 0);
    }
    root.destroy();
  });

  it('keeps native font scale per root when global metrics change', () => {
    const first = Fantom.createRoot({fontScale: 1});
    const firstRef = createRef<HostInstance>();
    const secondRef = createRef<HostInstance>();
    const style = {width: 120, fontSize: 16, lineHeight: 24};
    const text = 'Fantom measures text across multiple lines.';
    Fantom.runTask(() =>
      first.render(
        <Text ref={firstRef} style={style}>
          {text}
        </Text>,
      ),
    );
    const before = nullthrows(firstRef.current).getBoundingClientRect();
    const second = Fantom.createRoot({fontScale: 2});
    Fantom.runTask(() => {
      second.render(
        <Text ref={secondRef} style={style}>
          {text}
        </Text>,
      );
      first.render(
        <Text ref={firstRef} style={style}>
          {text}!
        </Text>,
      );
    });
    const after = nullthrows(firstRef.current).getBoundingClientRect();
    const scaled = nullthrows(secondRef.current).getBoundingClientRect();
    expect(after.height).toBe(before.height);
    expect(scaled.width).toBe(before.width);
    expect(scaled.height).toBeGreaterThan(before.height * 2);
    first.destroy();
    second.destroy();
  });
});
