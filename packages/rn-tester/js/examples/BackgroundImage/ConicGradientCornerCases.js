/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  BackgroundImageValue,
  RadialGradientPosition,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

import RNTesterButton from '../../components/RNTesterButton';
import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type ViewStyleProp = NonNullable<React.PropOf<View, 'style'>>;
type Example = {
  title: string,
  expected: string,
  width: number,
  height: number,
  css: string,
  object: ReadonlyArray<BackgroundImageValue>,
  tile?: boolean,
  center?: (width: number, height: number) => {left: number, top: number},
};

const stopCSS =
  '#ef4444 0deg 45deg, #2563eb 45deg 180deg, #22c55e 180deg 360deg';
function conic(
  from: string = '0deg',
  position?: RadialGradientPosition,
): BackgroundImageValue {
  return {
    type: 'conic-gradient',
    from,
    position,
    colorStops: [
      {color: '#ef4444', positions: ['0deg', '45deg']},
      {color: '#2563eb', positions: ['45deg', '180deg']},
      {color: '#22c55e', positions: ['180deg', '360deg']},
    ],
  };
}
const centered = (width: number, height: number) => ({
  left: width / 2,
  top: height / 2,
});
const examples: ReadonlyArray<Example> = [
  {
    title: 'Wide rectangle',
    expected: 'The red wedge spans 45 degrees, regardless of aspect ratio.',
    width: 240,
    height: 120,
    css: `conic-gradient(${stopCSS})`,
    object: [conic()],
    center: centered,
  },
  {
    title: 'Tall rectangle',
    expected: 'The red wedge has the same angle as the wide rectangle.',
    width: 120,
    height: 240,
    css: `conic-gradient(${stopCSS})`,
    object: [conic()],
    center: centered,
  },
  {
    title: 'Extreme aspect ratio',
    expected: 'A thin strip must not stretch the red wedge.',
    width: 280,
    height: 28,
    css: `conic-gradient(${stopCSS})`,
    object: [conic()],
    center: centered,
  },
  {
    title: '90-degree rotation',
    expected: 'The red wedge begins at the right and sweeps clockwise.',
    width: 240,
    height: 120,
    css: `conic-gradient(from 90deg, ${stopCSS})`,
    object: [conic('90deg')],
    center: centered,
  },
  {
    title: 'Right and bottom offsets',
    expected: 'The center is 10 points from the right and 20 from the bottom.',
    width: 240,
    height: 120,
    css: `conic-gradient(at right 10px bottom 20px, ${stopCSS})`,
    object: [conic('0deg', {right: 10, bottom: 20})],
    center: (w, h) => ({left: w - 10, top: h - 20}),
  },
  {
    title: 'Percentage offsets',
    expected:
      'The center stays at 75% of the original width and height after resizing.',
    width: 240,
    height: 120,
    css: `conic-gradient(at right 25% bottom 25%, ${stopCSS})`,
    object: [conic('0deg', {right: '25%', bottom: '25%'})],
    center: (w, h) => ({left: w * 0.75, top: h * 0.75}),
  },
  {
    title: 'Zero edge offsets',
    expected: 'The center is exactly at the bottom-right corner.',
    width: 240,
    height: 120,
    css: `conic-gradient(at right 0px bottom 0px, ${stopCSS})`,
    object: [conic('0deg', {right: 0, bottom: 0})],
    center: (w, h) => ({left: w, top: h}),
  },
  {
    title: 'Fractional offsets',
    expected:
      'The center is 10.5 points from the right and 20.25 from the bottom.',
    width: 240,
    height: 120,
    css: `conic-gradient(at right 10.5px bottom 20.25px, ${stopCSS})`,
    object: [conic('0deg', {right: 10.5, bottom: 20.25})],
    center: (w, h) => ({left: w - 10.5, top: h - 20.25}),
  },
  {
    title: 'Center outside the view',
    expected:
      'With the center above and left of the view, the visible area should be blue.',
    width: 240,
    height: 120,
    css: `conic-gradient(at left -20px top -20px, ${stopCSS})`,
    object: [conic('0deg', {left: -20, top: -20})],
  },
  {
    title: 'Equivalent negative rotation',
    expected: 'Minus 270 degrees should look exactly like the 90-degree case.',
    width: 240,
    height: 120,
    css: `conic-gradient(from -270deg, ${stopCSS})`,
    object: [conic('-270deg')],
    center: centered,
  },
  {
    title: 'Repeated rectangular tiles',
    expected:
      'Three columns and three rows of 80 by 40 tiles. Each has its own undistorted center.',
    width: 240,
    height: 120,
    css: `conic-gradient(${stopCSS})`,
    object: [conic()],
    tile: true,
  },
  {
    title: 'Transition hint',
    expected:
      'Red and blue blend, with the midpoint at 90 degrees. Both syntaxes should match.',
    width: 240,
    height: 120,
    css: 'conic-gradient(#ef4444, 90deg, #2563eb)',
    object: [
      {
        type: 'conic-gradient',
        colorStops: [
          {color: '#ef4444'},
          {color: null, positions: ['90deg']},
          {color: '#2563eb'},
        ],
      },
    ],
    center: centered,
  },
  {
    title: 'Mixed background layers',
    expected:
      'The transparent half of the conic layer reveals the black-to-white linear gradient.',
    width: 240,
    height: 120,
    css: 'conic-gradient(#ef4444 0deg 180deg, transparent 180deg 360deg), linear-gradient(90deg, black, white)',
    object: [
      {
        type: 'conic-gradient',
        colorStops: [
          {color: '#ef4444', positions: ['0deg', '180deg']},
          {color: 'transparent', positions: ['180deg', '360deg']},
        ],
      },
      {
        type: 'linear-gradient',
        direction: '90deg',
        colorStops: [{color: 'black'}, {color: 'white'}],
      },
    ],
  },
  {
    title: 'Invalid trailing hint',
    expected: 'No gradient: only the gray fallback background should remain.',
    width: 240,
    height: 120,
    css: 'conic-gradient(red, blue, 20%)',
    object: [
      {
        type: 'conic-gradient',
        colorStops: [
          {color: 'red'},
          {color: 'blue'},
          {color: null, positions: ['20%']},
        ],
      },
    ],
  },
  {
    title: 'Too many stop positions',
    expected: 'No gradient: a color stop cannot have three positions.',
    width: 240,
    height: 120,
    css: 'conic-gradient(red 0deg 45deg 90deg, blue)',
    object: [
      {
        type: 'conic-gradient',
        colorStops: [
          {color: 'red', positions: ['0deg', '45deg', '90deg']},
          {color: 'blue'},
        ],
      },
    ],
  },
  {
    title: 'Zero-size view',
    expected:
      'Nothing should paint or crash. Next restores a visible gradient.',
    width: 0,
    height: 0,
    css: `conic-gradient(${stopCSS})`,
    object: [conic()],
  },
];

export default function ConicGradientCornerCases(): React.Node {
  const [index, setIndex] = React.useState(0);
  const [objectSyntax, setObjectSyntax] = React.useState(false);
  const [swapped, setSwapped] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const example = examples[index];
  const width = swapped ? example.height : example.width;
  const height = swapped ? example.width : example.height;
  const center = example.center?.(width, height);
  const previewStyle: ViewStyleProp = {
    width,
    height,
    backgroundColor: '#d1d5db',
    backgroundImage: hidden ? [] : objectSyntax ? example.object : example.css,
    backgroundSize: example.tile === true ? '80px 40px' : 'auto',
    backgroundRepeat: example.tile === true ? 'repeat' : 'no-repeat',
  };
  function select(offset: number) {
    setIndex((index + offset + examples.length) % examples.length);
    setSwapped(false);
    setHidden(false);
  }
  return (
    <View>
      <Text style={styles.title} testID="conic-case-title">
        {index + 1}/{examples.length}: {example.title}
      </Text>
      <Text style={styles.description}>{example.expected}</Text>
      <View style={styles.buttons}>
        <RNTesterButton testID="conic-previous" onPress={() => select(-1)}>
          Previous
        </RNTesterButton>
        <RNTesterButton testID="conic-next" onPress={() => select(1)}>
          Next
        </RNTesterButton>
        <RNTesterButton
          testID="conic-syntax"
          onPress={() => setObjectSyntax(!objectSyntax)}>
          {objectSyntax ? 'Object syntax' : 'String syntax'}
        </RNTesterButton>
      </View>
      <Text testID="conic-dimensions">
        {width} × {height} · {hidden ? 'Gradient hidden' : 'Gradient visible'}
      </Text>
      <View style={styles.stage}>
        <View
          style={previewStyle}
          testID="conic-corner-preview"
          collapsable={false}>
          {center != null && !hidden ? (
            <View pointerEvents="none" style={[styles.center, center]} />
          ) : null}
        </View>
      </View>
      <View style={styles.buttons}>
        <RNTesterButton
          testID="conic-resize"
          onPress={() => setSwapped(!swapped)}>
          Swap dimensions
        </RNTesterButton>
        <RNTesterButton testID="conic-hide" onPress={() => setHidden(!hidden)}>
          {hidden ? 'Show gradient' : 'Hide gradient'}
        </RNTesterButton>
      </View>
      <Text style={styles.description}>
        The white ring marks the expected center. Compare both syntaxes, swap
        dimensions, and hide/show without remounting the view.
      </Text>
      <Text selectable style={styles.syntax}>
        {example.css}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {fontSize: 17, fontWeight: '600'},
  description: {marginVertical: 8},
  buttons: {flexDirection: 'row', flexWrap: 'wrap'},
  stage: {
    height: 290,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
    overflow: 'hidden',
  },
  center: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 4,
    transform: [{translateX: -4}, {translateY: -4}],
  },
  syntax: {fontSize: 12, marginVertical: 8},
});
