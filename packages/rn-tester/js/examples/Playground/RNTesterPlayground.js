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
 * Reproducer for facebook/react-native#58970: a wrapped <Text> whose box
 * crosses y = 2048 in the scroll content draws one line short on a 3x iOS
 * screen.
 *
 * Yoga rounds a node's height as round(bottom) - round(top), subtracting as
 * 32-bit floats. With the top below 2048 and the bottom above, the two edges
 * are quantized with different steps and the height comes out one float step
 * short: 43.9998779296875 instead of 44 for two lines of lineHeight 22. The
 * paragraph view hands that box to TextKit as the NSTextContainer size, the
 * second line "doesn't fit", and the text is laid out in the container's clip
 * mode as a single line.
 *
 * Expected: every box shows two lines ("top … / second line").
 * Actual:   the boxes crossing 2048 on a fraction (with nothing above this
 *           example: "top 2028+1/3" and "top 2028+2/3") show only their
 *           first line. Their onLayout height logs as 43.9998779296875 and
 *           onTextLayout reports 1 line. Texts are positioned absolutely,
 *           44pt apart, with fractions 0, 1/3 and 2/3, so one of them crosses
 *           2048 on a bad fraction whatever sits above this example.
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {
  LayoutEvent,
  TextLayoutEvent,
} from 'react-native/Libraries/Types/CoreEventTypes';

import * as React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

const TOPS = [1896, 1940, 1984, 2028];
const FRACTIONS = [0, 1 / 3, 2 / 3];

function Playground(): React.Node {
  return (
    <ScrollView contentOffset={{x: 0, y: 1800}}>
      <View style={styles.canvas}>
        {TOPS.map((top, i) =>
          FRACTIONS.map((fraction, j) => (
            <Text
              key={`${i}-${j}`}
              style={[styles.text, {top: top + fraction, left: 16 + j * 124}]}
              onLayout={(e: LayoutEvent) => {
                const h = e.nativeEvent.layout.height;
                if (h !== 44) {
                  console.log(`box top=${top + fraction}: height ${h}`);
                }
              }}
              onTextLayout={(e: TextLayoutEvent) => {
                const n = e.nativeEvent.lines.length;
                if (n !== 2) {
                  console.log(`box top=${top + fraction}: ${n} line(s)`);
                }
              }}>
              {`top ${top}+${j}/3\nsecond line`}
            </Text>
          )),
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  canvas: {
    height: 2300,
  },
  text: {
    position: 'absolute',
    width: 110,
    fontSize: 15,
    lineHeight: 22,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description:
    'Text drops its last line when its box crosses y = 2048 on a 3x screen',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
