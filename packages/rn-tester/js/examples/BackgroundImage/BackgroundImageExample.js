/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import {StyleSheet, Text, View} from 'react-native';

function BackgroundImageBox({
  style,
  children,
  testID,
}: {
  style?: ViewStyleProp,
  children?: React.Node,
  testID: string,
}) {
  return (
    <View style={[styles.box, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 200,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'black',
    textShadowRadius: 2,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
  },
  col: {
    alignItems: 'center',
  },
});

exports.title = 'BackgroundImage';
exports.category = 'UI';
exports.description = 'Examples of background gradients applied to views.';
exports.examples = [
  {
    title: 'Basic Linear Gradient',
    description: 'A simple linear gradient from top to bottom.',
    name: 'basic',
    render(): React.Node {
      return (
        <BackgroundImageBox
          style={{
            backgroundImage: 'linear-gradient(#e66465, #9198e5)',
          }}
          testID="background-image-basic">
          <Text style={styles.text}>Basic</Text>
        </BackgroundImageBox>
      );
    },
  },
  {
    title: 'Linear Gradient with Angle',
    name: 'angle',
    render(): React.Node {
      return (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text>45deg</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              }}
              testID="background-image-angle-1"
            />
          </View>
          <View style={styles.col}>
            <Text>90deg</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'linear-gradient(90deg, #a8edea, #fed6e3)',
              }}
              testID="background-image-angle-2"
            />
          </View>
          <View style={styles.col}>
            <Text>180deg</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffecd2, #fcb69f)',
              }}
              testID="background-image-angle-3"
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Linear Gradient with Multiple Colors',
    name: 'multiple-colors',
    render(): React.Node {
      return (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text>3 colors</Text>
            <BackgroundImageBox
              style={{
                backgroundImage:
                  'linear-gradient(to right, #ff6b6b, #4ecdc4, #45b7d1)',
              }}
              testID="background-image-multiple-colors-1"
            />
          </View>
          <View style={styles.col}>
            <Text>4 colors</Text>
            <BackgroundImageBox
              style={{
                backgroundImage:
                  'linear-gradient(to bottom, #667eea, #764ba2, #f093fb, #f5576c)',
              }}
              testID="background-image-multiple-colors-2"
            />
          </View>
          <View style={styles.col}>
            <Text>Rainbow</Text>
            <BackgroundImageBox
              style={{
                backgroundImage:
                  'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
              }}
              testID="background-image-multiple-colors-3"
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Radial Gradient',
    name: 'radial',
    render(): React.Node {
      return (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text>Circle</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #ff6b6b, #4ecdc4)',
              }}
              testID="background-image-radial-1"
            />
          </View>
          <View style={styles.col}>
            <Text>Ellipse</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(ellipse, #a8edea, #fed6e3)',
              }}
              testID="background-image-radial-2"
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Gradient with Background Repeat',
    name: 'repeat',
    render(): React.Node {
      return (
        <View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text>repeat</Text>
              <BackgroundImageBox
                style={{
                  width: 200,
                  height: 200,
                  backgroundImage:
                    'linear-gradient(45deg, #ff6b6b 25%, transparent 25%), linear-gradient(-45deg, #4ecdc4 25%, transparent 25%)',
                  experimental_backgroundRepeat: 'repeat',
                  experimental_backgroundSize: '20px 20px',
                }}
                testID="background-image-repeat-1"
              />
            </View>
            <View style={styles.col}>
              <Text>space</Text>
              <BackgroundImageBox
                style={{
                  width: 200,
                  height: 200,
                  backgroundImage: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                  experimental_backgroundRepeat: 'space',
                  experimental_backgroundSize: '50px 50px',
                }}
                testID="background-image-repeat-2"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text>round</Text>
              <BackgroundImageBox
                style={{
                  width: 200,
                  height: 200,
                  backgroundImage: 'linear-gradient(90deg, #a8edea, #fed6e3)',
                  experimental_backgroundRepeat: 'round',
                  experimental_backgroundSize: '60px 60px',
                }}
                testID="background-image-repeat-3"
              />
            </View>
            <View style={styles.col}>
              <Text>no-repeat</Text>
              <BackgroundImageBox
                style={{
                  width: 200,
                  height: 200,
                  backgroundImage: 'radial-gradient(circle, #ffecd2, #fcb69f)',
                  experimental_backgroundRepeat: 'no-repeat',
                  experimental_backgroundSize: '100px 100px',
                  backgroundColor: 'purple',
                }}
                testID="background-image-repeat-4"
              />
            </View>
          </View>
        </View>
      );
    },
  },
  {
    title: 'Gradient with Background Position',
    name: 'position',
    render(): React.Node {
      return (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text>center</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #ff6b6b, #4ecdc4)',
                experimental_backgroundRepeat: 'no-repeat',
                experimental_backgroundPosition: 'center',
                experimental_backgroundSize: '50px 50px',
                borderWidth: 1,
              }}
              testID="background-image-position-1"
            />
          </View>
          <View style={styles.col}>
            <Text>25% 75%</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #a8edea, #fed6e3)',
                experimental_backgroundRepeat: 'no-repeat',
                experimental_backgroundPosition: '25% 75%',
                borderWidth: 1,
                experimental_backgroundSize: '50px 50px',
              }}
              testID="background-image-position-2"
            />
          </View>
          <View style={styles.col}>
            <Text>right bottom</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #ffecd2, #fcb69f)',
                experimental_backgroundRepeat: 'no-repeat',
                experimental_backgroundPosition: 'right bottom',
                borderWidth: 1,
                experimental_backgroundSize: '50px 50px',
              }}
              testID="background-image-position-3"
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Multiple Gradients',
    name: 'multiple',
    render(): React.Node {
      return (
        <BackgroundImageBox
          style={{
            width: 300,
            height: 300,
            backgroundColor: '#101010',

            backgroundImage: `
              radial-gradient(circle at 30% 30%, rgba(255, 100, 150, 0.4), transparent 60%),
              radial-gradient(circle at 70% 60%, rgba(100, 200, 255, 0.3), transparent 50%),
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(135deg, rgba(255,255,255,0.02) 25%, transparent 25%),
              linear-gradient(225deg, rgba(255,255,255,0.02) 25%, transparent 25%);
            `,
            experimental_backgroundRepeat:
              'no-repeat, no-repeat, repeat, repeat, repeat, repeat',
            experimental_backgroundSize: `
              500px 500px,
              400px 400px,
              50px 50px,
              50px 50px,
              100px 100px,
              100px 100px`,
            experimental_backgroundPosition: `
              top left,
              bottom right,
              0 0,
              0 0,
              0 0,
              50px 50px`,
          }}
          testID="background-image-multiple"
        />
      );
    },
  },
  {
    title: 'Gradient with Borders',
    name: 'borders',
    render(): React.Node {
      return (
        <View style={styles.row}>
          <View style={styles.col}>
            <Text>borderRadius</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: 20,
              }}
              testID="background-image-borders-1"
            />
          </View>
          <View style={styles.col}>
            <Text>borderWidth + borderColor</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #f093fb, #f5576c)',
                borderWidth: 10,
                borderColor: 'red',
              }}
              testID="background-image-borders-2"
            />
          </View>
          <View style={styles.col}>
            <Text>non uniform borderRadius</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #f093fb, #f5576c)',
                borderTopLeftRadius: 10,
                borderTopRightRadius: 20,
                borderBottomLeftRadius: 30,
                borderBottomRightRadius: 40,
              }}
              testID="background-image-borders-3"
            />
          </View>
          <View style={styles.col}>
            <Text>non uniform borderWidth</Text>
            <BackgroundImageBox
              style={{
                backgroundImage: 'radial-gradient(circle, #f093fb, #f5576c)',
                borderTopWidth: 10,
                borderTopColor: 'red',
                borderBottomWidth: 20,
                borderBottomColor: 'blue',
              }}
              testID="background-image-borders-4"
            />
          </View>
        </View>
      );
    },
  },
  {
    title: 'Object syntax',
    name: 'object-syntax',
    render(): React.Node {
      return (
        <BackgroundImageBox
          style={{
            backgroundImage: [
              {
                type: 'linear-gradient',
                direction: 'to bottom',
                colorStops: [
                  {color: 'purple', positions: ['0%']},
                  {color: 'orange', positions: ['100%']},
                ],
              },
            ],
            experimental_backgroundRepeat: [
              {
                x: 'no-repeat',
                y: 'no-repeat',
              },
            ],
            experimental_backgroundPosition: [
              {
                top: '50%',
                left: '50%',
              },
            ],
            experimental_backgroundSize: [
              {
                x: '100%',
                y: '100%',
              },
              {
                x: 50,
                y: 50,
              },
            ],
          }}
          testID="background-image-object"
        />
      );
    },
  },
] as Array<RNTesterModuleExample>;
