/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Animated, Text} from 'react-native';

describe('Animated.Text', () => {
  it('renders its children and applies an animated style prop', () => {
    const root = Fantom.createRoot();
    const opacity = new Animated.Value(0.5);

    Fantom.runTask(() => {
      root.render(
        <Animated.Text style={{opacity}}>Hello Animated</Animated.Text>,
      );
    });

    expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
      <rn-paragraph opacity="0.5">Hello Animated</rn-paragraph>,
    );
  });

  it('drives a text style prop with an animation', () => {
    const root = Fantom.createRoot();
    const opacity = new Animated.Value(0);

    Fantom.runTask(() => {
      root.render(<Animated.Text style={{opacity}}>Fade</Animated.Text>);
    });

    // The animation starts from the initial value.
    expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
      <rn-paragraph opacity="0">Fade</rn-paragraph>,
    );

    let finished = false;
    Fantom.runTask(() => {
      Animated.timing(opacity, {
        toValue: 0.25,
        duration: 100,
        useNativeDriver: false,
      }).start(result => {
        finished = result.finished;
      });
    });
    Fantom.unstable_produceFramesForDuration(200);
    Fantom.runWorkLoop();

    expect(finished).toBe(true);
    expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
      <rn-paragraph opacity="0.25">Fade</rn-paragraph>,
    );
  });
});

describe('Animated.SectionList', () => {
  it('renders section headers and items through the animated wrapper', () => {
    const root = Fantom.createRoot({viewportWidth: 400, viewportHeight: 400});

    Fantom.runTask(() => {
      root.render(
        <Animated.SectionList
          sections={[{title: 'A', data: ['x']}]}
          renderItem={({item}: {item: string, ...}) => <Text>{item}</Text>}
          renderSectionHeader={({
            section,
          }: {
            section: {title: string, ...},
            ...
          }) => <Text>{section.title}</Text>}
          keyExtractor={(item: string) => item}
        />,
      );
    });

    expect(root.getRenderedOutput({props: []}).toJSON()).toEqual({
      type: 'ScrollView',
      props: {},
      children: [
        {
          type: 'View',
          props: {},
          children: [
            {type: 'Paragraph', props: {}, children: ['A']},
            {type: 'Paragraph', props: {}, children: ['x']},
          ],
        },
      ],
    });
  });
});
