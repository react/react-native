/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TextStyle} from 'react-native';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const INLINE_SIZE = 18;
const DEFAULT_FONT_SIZE = 20;
const MEDIUM_FONT_SIZE = 24;
const LARGE_FONT_SIZE = 32;
const TALL_LINE_HEIGHT = 48;
const FONT_FAMILY = 'Helvetica';
const SERIF_FONT_FAMILY = 'TimesNewRomanPSMT';
const SPACING = 8;

type Sample = Readonly<{
  name: string,
  textStyle: TextStyle,
  height?: number,
  isNested?: boolean,
  isWrapped?: boolean,
  isScaled?: boolean,
}>;

const SAMPLES: Sample[] = [
  {
    name: 'Helvetica 12 (control)',
    textStyle: {fontFamily: FONT_FAMILY, fontSize: 12},
  },
  {name: 'System 20', textStyle: {fontSize: DEFAULT_FONT_SIZE}},
  {
    name: 'Helvetica 32',
    textStyle: {fontFamily: FONT_FAMILY, fontSize: LARGE_FONT_SIZE},
  },
  {
    name: 'Times New Roman 32',
    textStyle: {fontFamily: SERIF_FONT_FAMILY, fontSize: LARGE_FONT_SIZE},
  },
  {
    name: 'Courier bold 24',
    textStyle: {
      fontFamily: 'Courier',
      fontSize: MEDIUM_FONT_SIZE,
      fontWeight: 'bold',
    },
  },
  {
    name: 'Helvetica 32 / lineHeight 48',
    textStyle: {
      fontFamily: FONT_FAMILY,
      fontSize: LARGE_FONT_SIZE,
      lineHeight: TALL_LINE_HEIGHT,
    },
  },
  {
    name: 'Nested Times New Roman 32',
    textStyle: {fontFamily: SERIF_FONT_FAMILY, fontSize: LARGE_FONT_SIZE},
    isNested: true,
  },
  {
    name: 'Tall View / Helvetica 20',
    textStyle: {fontFamily: FONT_FAMILY, fontSize: DEFAULT_FONT_SIZE},
    height: TALL_LINE_HEIGHT,
  },
  {
    name: 'Wrapped / Helvetica 24',
    textStyle: {fontFamily: FONT_FAMILY, fontSize: MEDIUM_FONT_SIZE},
    isWrapped: true,
  },
  {
    name: 'Scaled / Helvetica 20',
    textStyle: {fontFamily: FONT_FAMILY, fontSize: DEFAULT_FONT_SIZE},
    isScaled: true,
  },
];

function InlineViewBaselineSample({
  name,
  textStyle,
  height = INLINE_SIZE,
  isNested = false,
  isWrapped = false,
  isScaled = false,
}: Sample): React.Node {
  const [baseline, setBaseline] = React.useState<?number>();
  const [bottom, setBottom] = React.useState<?number>();
  const inlineRef = React.useRef<React.ElementRef<typeof View> | null>(null);

  React.useEffect(() => {
    inlineRef.current?.measure((x, y, width, measuredHeight) => {
      setBottom(measuredHeight > 0 ? y + measuredHeight : undefined);
    });
  }, [baseline]);

  const error =
    baseline != null && bottom != null ? bottom - baseline : undefined;
  const content = (
    <>
      {'Hg '}
      <View ref={inlineRef} testID={name} style={[styles.inline, {height}]} />
      {' Hg'}
    </>
  );

  return (
    <View style={styles.sample}>
      <RNTesterText allowFontScaling={false} variant="label">
        {name}
      </RNTesterText>
      <View style={styles.paragraph}>
        <Text
          allowFontScaling={isScaled}
          style={[styles.text, isNested ? styles.nestedParent : textStyle]}
          onTextLayout={event => {
            const line = event.nativeEvent.lines[isWrapped ? 1 : 0];
            if (line != null) {
              setBaseline(line.y + line.ascender);
            }
          }}>
          {isWrapped ? 'First line\n' : ''}
          {isNested ? <Text style={textStyle}>{content}</Text> : content}
        </Text>
        {baseline != null ? (
          <View
            pointerEvents="none"
            style={[styles.baseline, {top: baseline}]}
          />
        ) : null}
      </View>
      <RNTesterText
        allowFontScaling={false}
        testID={`${name}-metrics`}
        style={styles.metrics}>
        {error == null
          ? baseline == null
            ? 'Measuring...'
            : 'View measurement unavailable'
          : `baseline ${baseline?.toFixed(3)} | bottom ${bottom?.toFixed(3)} | error ${error.toFixed(3)} pt`}
      </RNTesterText>
    </View>
  );
}

export function TextInlineViewBaselineExample(): React.Node {
  const {scale, fontScale} = useWindowDimensions();

  return (
    <ScrollView
      contentContainerStyle={styles.example}
      contentInsetAdjustmentBehavior="automatic"
      testID="inline-view-baseline-example">
      <RNTesterText allowFontScaling={false} variant="label">
        Each blue View should end at the red text baseline. Allow one physical
        pixel for rounding. Enlarge the system text size to check the scaled
        sample.
      </RNTesterText>
      <RNTesterText allowFontScaling={false} style={styles.metrics}>
        {`One pixel: ${(1 / scale).toFixed(3)} pt | font scale: ${fontScale.toFixed(3)} (last sample only)`}
      </RNTesterText>
      {SAMPLES.map(sample => (
        <InlineViewBaselineSample key={sample.name} {...sample} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  example: {gap: SPACING, padding: SPACING * 2},
  sample: {gap: SPACING / 2},
  paragraph: {backgroundColor: '#f1f5f9'},
  text: {color: 'black'},
  inline: {width: INLINE_SIZE, backgroundColor: '#2563eb'},
  baseline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#dc2626',
  },
  nestedParent: {fontFamily: FONT_FAMILY, fontSize: 16},
  metrics: {fontSize: 10, fontFamily: 'Menlo'},
});
