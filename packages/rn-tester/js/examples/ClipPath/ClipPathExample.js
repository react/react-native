/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {RNTesterModule} from '../../types/RNTesterTypes';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {
  Animated,
  Button,
  Image,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  demoContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
  },
  demoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
  },
  demoLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
    color: '#666',
    maxWidth: 100,
  },
  outerBox: {
    width: 80,
    height: 80,
    borderWidth: 4,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    borderColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerBox: {
    width: 30,
    height: 30,
    borderRadius: 25,
    borderWidth: 2,
    backgroundColor: '#F59E0B',
    borderColor: '#B45309',
  },
  imageBox: {
    width: 80,
    height: 80,
    margin: 10,
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  textExample: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E40AF',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#dc2626',
    backgroundColor: '#f3f4f6',
    padding: 8,
    width: 200,
    height: 60,
  },
});

function ExampleBox({
  clipPath,
  label,
  style,
  children,
}: {
  clipPath: string,
  label?: string,
  style?: ViewStyleProp,
  children?: React.Node,
}): React.Node {
  return (
    <View style={styles.demoBox}>
      <View style={[styles.outerBox, {clipPath}, style]}>
        {children != null ? children : <View style={styles.innerBox} />}
      </View>
      {label != null && <RNTesterText style={styles.demoLabel}>{label}</RNTesterText>}
    </View>
  );
}

const AnimatedClipPathExample = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [isAnimated, setIsAnimated] = React.useState(false);
  const [clipPath, setClipPath] = React.useState('circle(30%)');

  React.useEffect(() => {
    const listenerId = animatedValue.addListener(({value}) => {
      const radius = 30 + value * 30; // Interpolate from 30% to 50%
      setClipPath(`circle(${radius}%)`);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [animatedValue]);

  const onPress = () => {
    Animated.timing(animatedValue, {
      toValue: isAnimated ? 0 : 1,
      duration: 1000,
      useNativeDriver: false,
    }).start(() => setIsAnimated(!isAnimated));
  };

  return (
    <View style={{flexDirection: 'column', alignItems: 'center'}}>
      <Button onPress={onPress} title={isAnimated ? 'Reset' : 'Animate'} />
      <View
        style={[
          styles.outerBox,
          {
            clipPath: clipPath,
          },
        ]}>
        <View style={styles.innerBox} />
      </View>
    </View>
  );
};

export default {
  title: 'Clip Path',
  category: 'UI',
  description:
    'Demonstrates clip-path support for creating custom clipping regions.',
  examples: [
    {
      title: 'Circle',
      name: 'circle',
      description: 'circle(radius) and circle(radius at x y)',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <ExampleBox clipPath="circle(45px)" label="circle(45px)" />
              <ExampleBox
                clipPath="circle(50px at 75% 75%)"
                label="circle(50px at 75% 75%)"
              />
              <ExampleBox clipPath="circle(50%)" label="circle(50%)" />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Ellipse',
      name: 'ellipse',
      description: 'ellipse(rx ry) and ellipse(rx ry at x y)',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <ExampleBox
                clipPath="ellipse(40px 20px)"
                label="ellipse(40px 20px)"
              />
              <ExampleBox
                clipPath="ellipse(40% 20% at 10px 10px)"
                label="ellipse(40% 20% at 10px 10px)"
              />
              <ExampleBox
                clipPath="ellipse(50% 30%)"
                label="ellipse(50% 30%)"
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Inset',
      name: 'inset',
      description: 'inset(offsets) with optional rounding',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <ExampleBox
                clipPath="inset(10% round 10px)"
                label="inset(10% round 10px)"
              />
              <ExampleBox
                clipPath="inset(10% 20% 30% 40%)"
                label="inset(10% 20% 30% 40%)"
              />
              <ExampleBox
                clipPath="inset(15px round 15px)"
                label="inset(15px round 15px)"
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Polygon',
      name: 'polygon',
      description: 'polygon(fill-rule, points...) for complex shapes',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <ExampleBox
                clipPath="polygon(evenodd, 50% 0%, 21% 90%, 98% 35%, 2% 35%, 79% 90%)"
                label="Star shape"
              />
              <ExampleBox
                clipPath="polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                label="Diamond"
              />
              <ExampleBox
                clipPath="polygon(11% 45%, 60% 45%, 60% 25%, 90% 50%, 60% 75%, 60% 55%, 10% 55%)"
                label="Arrow shape"
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Rect',
      name: 'rect',
      description: 'rect(top right bottom left) with optional rounding',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <ExampleBox
                clipPath="rect(0% 50% 50% 0%)"
                label="rect(0% 50% 50% 0%)"
              />
              <ExampleBox
                clipPath="rect(auto 60% 60% auto round 25px)"
                label="rect(auto 60% 60% auto round 25px)"
              />
              <ExampleBox
                clipPath="rect(10px 70px 70px 10px round 10px)"
                label="rect(10px 70px 70px 10px round 10px)"
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'XYWH',
      name: 'xywh',
      description: 'xywh(x y width height) with optional rounding',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <ExampleBox
                clipPath="xywh(10px 10px 60px 60px)"
                label="xywh(10px 10px 60px 60px)"
              />
              <ExampleBox
                clipPath="xywh(10% 10% 50% 50% round 10px)"
                label="xywh(10% 10% 50% 50% round 10px)"
              />
              <ExampleBox
                clipPath="xywh(5px 5px 70px 70px round 15px)"
                label="xywh(5px 5px 70px 70px round 15px)"
              />
            </View>
          </View>
        );
      },
    },
    {
      title: 'Margin Box',
      name: 'margin-box',
      description: 'margin-box',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <View
                  style={[
                    styles.outerBox,
                    {
                      clipPath:
                        'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%) margin-box',
                      marginTop: 20,
                      marginLeft: 10,
                      borderWidth: 8,
                    },
                  ]}>
                  <View style={styles.innerBox} />
                </View>
                <RNTesterText style={styles.demoLabel}>margin-box</RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Border Box',
      name: 'border-box',
      description: 'border-box',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <View
                  style={[
                    styles.outerBox,
                    {
                      clipPath: 'border-box',
                      margin: 10,
                      borderWidth: 10,
                    },
                  ]}>
                  <View style={styles.innerBox} />
                </View>
                <RNTesterText style={styles.demoLabel}>border-box</RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Padding Box',
      name: 'padding-box',
      description: 'padding-box',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <View
                  style={[
                    styles.outerBox,
                    {
                      clipPath: 'padding-box',
                      borderWidth: 10,
                      borderRadius: 15,
                    },
                  ]}>
                  <View style={styles.innerBox} />
                </View>
                <RNTesterText style={styles.demoLabel}>
                  padding-box
                </RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Content Box',
      name: 'content-box',
      description: 'content-box',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <View
                  style={[
                    styles.outerBox,
                    {
                      clipPath: 'content-box',
                      padding: 10,
                      borderWidth: 10,
                      borderRadius: 35,
                    },
                  ]}>
                  <View style={styles.innerBox} />
                </View>
                <RNTesterText style={styles.demoLabel}>
                  content-box
                </RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Component Support - Image',
      name: 'component-image',
      description: 'Clip-path applied to Image components',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <Image
                  style={[
                    styles.imageBox,
                    {clipPath: 'circle(40px at 40px 40px)'},
                  ]}
                  source={{
                    uri: 'https://reactnative.dev/img/tiny_logo.png',
                  }}
                />
                <RNTesterText style={styles.demoLabel}>Circle</RNTesterText>
              </View>
              <View style={styles.demoBox}>
                <Image
                  style={[
                    styles.imageBox,
                    {clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'},
                  ]}
                  source={{
                    uri: 'https://reactnative.dev/img/tiny_logo.png',
                  }}
                />
                <RNTesterText style={styles.demoLabel}>Diamond</RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Component Support - Text',
      name: 'component-text',
      description: 'Clip-path applied to Text components',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <View style={styles.textContainer}>
                  <RNTesterText
                    style={[
                      styles.textExample,
                      {clipPath: 'ellipse(50% 30% at 50% 50%)'},
                    ]}>
                    TEXT
                  </RNTesterText>
                </View>
                <RNTesterText style={styles.demoLabel}>Ellipse</RNTesterText>
              </View>
              <View style={styles.demoBox}>
                <View style={styles.textContainer}>
                  <RNTesterText
                    style={[
                      styles.textExample,
                      {clipPath: 'circle(30px at 0px 0px)'},
                    ]}>
                    TEXT
                  </RNTesterText>
                </View>
                <RNTesterText style={styles.demoLabel}>Circle</RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Component Support - TextInput',
      name: 'component-textinput',
      description: 'Clip-path applied to TextInput components',
      render: function (): React.Node {
        return (
          <View style={styles.container}>
            <View style={styles.demoContainer}>
              <View style={styles.demoBox}>
                <TextInput
                  style={[
                    styles.inputBox,
                    {clipPath: 'ellipse(30% 41% at 50% 50%)'},
                  ]}
                  defaultValue="Type here..."
                />
                <RNTesterText style={styles.demoLabel}>Ellipse</RNTesterText>
              </View>
              <View style={styles.demoBox}>
                <TextInput
                  style={[styles.inputBox, {clipPath: 'inset(20% round 15px)'}]}
                  defaultValue="Rounded"
                />
                <RNTesterText style={styles.demoLabel}>Inset</RNTesterText>
              </View>
            </View>
          </View>
        );
      },
    },
    {
      title: 'Animated Clip Path',
      name: 'animated-clip-path',
      description: 'Animated clip-path',
      render: function (): React.Node {
        return <AnimatedClipPathExample />;
      },
    },
  ],
} as RNTesterModule;
