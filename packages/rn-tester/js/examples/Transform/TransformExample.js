/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';
import type {
  PressableAndroidRippleConfig,
  PressableStateCallbackType,
} from 'react-native';
import type {AnimatedNode} from 'react-native/Libraries/Animated/AnimatedExports';
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet';

import * as React from 'react';
import {useEffect, useState} from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useAnimatedValue,
} from 'react-native';

function AnimateTransformSingleProp() {
  const [theta] = useState(new Animated.Value(45));
  const animate = () => {
    theta.setValue(0);
    Animated.timing(theta, {
      toValue: 100,
      duration: 3000,
      useNativeDriver: false,
    }).start(animate);
  };

  useEffect(() => {
    animate();
  });

  return (
    <View style={styles.flipCardContainer}>
      <Animated.View
        style={[
          styles.box6,
          {
            transform: [
              {
                rotate: theta.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.flipText}>This text is flipping great.</Text>
      </Animated.View>
    </View>
  );
}

function TransformOriginExample() {
  const rotateAnim = useAnimatedValue(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 5000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.transformOriginWrapper}>
      <Animated.View
        style={[
          styles.transformOriginView,
          {
            transform: [{rotate: spin}],
          },
        ]}
      />
    </View>
  );
}

function Flip() {
  const [theta] = useState(new Animated.Value(45));
  const animate = () => {
    theta.setValue(0);
    Animated.timing(theta, {
      toValue: 360,
      duration: 5000,
      useNativeDriver: false,
    }).start(animate);
  };

  useEffect(() => {
    animate();
  });

  return (
    <View style={styles.flipCardContainer}>
      <Animated.View
        style={[
          styles.flipCard,
          {
            transform: [
              {perspective: 850},
              {
                rotateX: theta.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.flipText}>This text is flipping great.</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.flipCard,
          styles.flipCard1,
          {
            transform: [
              {perspective: 850},
              {
                rotateX: theta.interpolate({
                  inputRange: [0, 180],
                  outputRange: ['180deg', '360deg'],
                }),
              },
            ],
          },
        ]}>
        <Text style={styles.flipText}>On the flip side...</Text>
      </Animated.View>
    </View>
  );
}

function TranslatePercentage() {
  return <View style={styles.translatePercentageView} />;
}

function TranslateMatrix2D() {
  return <View style={styles.translateMatrix2D} />;
}
function TranslateMatrix3D() {
  return <View style={styles.translateMatrix3D} />;
}

// Regression example for #50797: a view with `scaleY: 0` (or any non-invertible transform)
// must not receive touches. The first row uses a literal `scaleY: 0`; the second row lets you
// type a scale so you can verify touches disappear exactly when scale reaches 0 and come back
// when it's non-zero. "last tapped" should never show "zero-scale" for the first row.
function ScaleZeroHitTestExample(): React.Node {
  const [text, setText] = useState('0.5');
  const [scale, setScale] = useState(0.5);
  const [lastTapped, setLastTapped] = useState('(none)');

  return (
    <View testID="transform-scale-zero-hit-test">
      <View style={styles.scaleZeroRow}>
        <View style={styles.scaleZeroHidden}>
          <Pressable
            testID="scale-zero-hidden-pressable"
            onPress={() => setLastTapped('zero-scale')}
            style={styles.scaleZeroTarget}
          />
        </View>
      </View>
      <View style={styles.scaleZeroRow}>
        <View style={{height: 100, transform: [{scaleY: scale}]}}>
          <Pressable
            testID="scale-zero-variable-pressable"
            onPress={() => setLastTapped(`variable (scaleY=${scale})`)}
            style={styles.scaleZeroTarget}
          />
        </View>
      </View>
      <View style={styles.scaleZeroInputRow}>
        <Text>Scale for second row:</Text>
        <TextInput
          testID="scale-zero-input"
          value={text}
          keyboardType="numeric"
          style={styles.scaleZeroInput}
          onChangeText={next => {
            setText(next);
            const parsed = parseFloat(next);
            if (isFinite(parsed)) {
              setScale(parsed);
            }
          }}
        />
      </View>
      <Text testID="scale-zero-last-tapped">Last tapped: {lastTapped}</Text>
    </View>
  );
}

function SkewExample(): React.Node {
  const [tapped, setTapped] = useState<string>('(none)');
  const skewAnim = useAnimatedValue(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(skewAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(skewAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [skewAnim]);

  const animatedSkewX = skewAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  const ripple: PressableAndroidRippleConfig = {
    color: 'rgba(255,255,255,0.4)',
  };
  const tapStyle =
    (extra: ViewStyleProp) =>
    ({pressed}: PressableStateCallbackType): ViewStyleProp => [
      styles.skewBox,
      extra,
      pressed && styles.skewBoxPressed,
    ];

  return (
    <View testID="transform-skew-27649" style={styles.skewContainer}>
      <Text style={styles.skewLabel}>Last tapped: {tapped}</Text>
      <Text style={styles.skewNote}>
        Tap any box to confirm hit testing follows the rendered parallelogram on
        both platforms.
      </Text>
      <View style={styles.skewRow}>
        <Pressable
          testID="skew-27649-x"
          android_ripple={ripple}
          onPress={() => setTapped('skewX 20deg')}
          style={tapStyle(styles.skewBoxX)}>
          <Text style={styles.skewBoxText}>skewX</Text>
        </Pressable>
        <Pressable
          testID="skew-27649-y"
          android_ripple={ripple}
          onPress={() => setTapped('skewY 20deg')}
          style={tapStyle(styles.skewBoxY)}>
          <Text style={styles.skewBoxText}>skewY</Text>
        </Pressable>
        <Pressable
          testID="skew-27649-xy"
          android_ripple={ripple}
          onPress={() => setTapped('skewX+Y')}
          style={tapStyle(styles.skewBoxXY)}>
          <Text style={styles.skewBoxText}>skewX+Y</Text>
        </Pressable>
      </View>
      <View style={styles.skewRow}>
        <Pressable
          testID="skew-27649-xr"
          android_ripple={ripple}
          onPress={() => setTapped('skewX + rotate')}
          style={tapStyle(styles.skewBoxXR)}>
          <Text style={styles.skewBoxText}>+rotate</Text>
        </Pressable>
        <Pressable
          testID="skew-27649-xs"
          android_ripple={ripple}
          onPress={() => setTapped('skewX + scale')}
          style={tapStyle(styles.skewBoxXS)}>
          <Text style={styles.skewBoxText}>+scale</Text>
        </Pressable>
        <Pressable
          testID="skew-27649-xt"
          android_ripple={ripple}
          onPress={() => setTapped('skewX + translate')}
          style={tapStyle(styles.skewBoxXT)}>
          <Text style={styles.skewBoxText}>+translate</Text>
        </Pressable>
      </View>
      <Text style={styles.skewLabel}>Animated (useNativeDriver: true)</Text>
      <Animated.View
        testID="skew-27649-animated"
        style={[styles.skewBox, {transform: [{skewX: animatedSkewX}]}]}>
        <Text style={styles.skewBoxText}>0deg to 20deg</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 500,
  },
  box1: {
    left: 0,
    backgroundColor: 'green',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {translateX: 100},
      {translateY: 50},
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
    ],
    width: 50,
  },
  box2: {
    left: 0,
    backgroundColor: 'purple',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {scaleX: 2},
      {scaleY: 2},
      {translateX: 100},
      {translateY: 50},
      {rotate: '30deg'},
    ],
    width: 50,
  },
  box3step1: {
    left: 0,
    backgroundColor: 'lightpink',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [{rotate: '30deg'}],
    width: 50,
  },
  box3step2: {
    left: 0,
    backgroundColor: 'hotpink',
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [{rotate: '30deg'}, {scaleX: 2}, {scaleY: 2}],
    width: 50,
  },
  box3step3: {
    left: 0,
    backgroundColor: 'deeppink',
    height: 50,
    opacity: 0.5,
    position: 'absolute',
    top: 0,
    transform: [
      {rotate: '30deg'},
      {scaleX: 2},
      {scaleY: 2},
      {translateX: 100},
      {translateY: 50},
    ],
    width: 50,
  },
  box4: {
    left: 0,
    backgroundColor: 'darkorange',
    height: 50,
    position: 'absolute',
    top: 0,
    transform: [
      {
        translate: [200, 350] as [
          number | string | AnimatedNode,
          number | string | AnimatedNode,
        ],
      },
      {scale: 2.5},
      {rotate: '-0.2rad'},
    ],
    width: 100,
  },
  box5: {
    backgroundColor: 'maroon',
    height: 50,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
  },
  box5Transform: {
    transform: [
      {
        translate: [-50, 35] as [
          number | string | AnimatedNode,
          number | string | AnimatedNode,
        ],
      },
      {rotate: '50deg'},
      {scale: 2},
    ],
  },
  box6: {
    backgroundColor: 'salmon',
    alignSelf: 'center',
  },
  box7: {
    backgroundColor: 'lightseagreen',
    height: 50,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 50,
  },
  box7Transform: {
    transform: 'translate(-50px, 35px) rotate(50deg) scale(2)',
  },
  flipCardContainer: {
    marginVertical: 40,
    flex: 1,
    alignSelf: 'center',
    zIndex: 0,
  },
  flipCard: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    backfaceVisibility: 'hidden',
  },
  flipCard1: {
    position: 'absolute',
    top: 0,
    backgroundColor: 'red',
  },
  flipText: {
    width: 90,
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
  transformOriginWrapper: {
    alignItems: 'center',
  },
  transformOriginView: {
    backgroundColor: 'pink',
    width: 100,
    height: 100,
    transformOrigin: 'top left',
  },
  translatePercentageView: {
    transform: 'translate(50%)',
    padding: 50,
    alignSelf: 'flex-start',
    backgroundColor: 'lightblue',
  },
  translateMatrix2D: {
    transform: [{matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1]}],
    width: 50,
    height: 50,
    backgroundColor: 'red',
  },
  translateMatrix3D: {
    transform: [{matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]}],
    height: 50,
    width: 50,
    backgroundColor: 'green',
  },
  scaleZeroRow: {
    backgroundColor: 'green',
    marginTop: 10,
  },
  scaleZeroHidden: {
    height: 100,
    transform: [{scaleY: 0}],
  },
  scaleZeroTarget: {
    flex: 1,
    backgroundColor: 'red',
  },
  scaleZeroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    columnGap: 8,
  },
  scaleZeroInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skewContainer: {paddingHorizontal: 16, paddingVertical: 12},
  skewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  skewLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
    color: 'black',
  },
  skewNote: {fontSize: 11, color: 'gray', marginTop: 6},
  skewBox: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'tomato',
  },
  skewBoxText: {color: 'white', fontWeight: 'bold', fontSize: 11},
  skewBoxPressed: {opacity: 0.5},
  skewBoxX: {transform: [{skewX: '20deg'}]},
  skewBoxY: {transform: [{skewY: '20deg'}]},
  skewBoxXY: {transform: [{skewX: '20deg'}, {skewY: '10deg'}]},
  skewBoxXR: {transform: [{skewX: '20deg'}, {rotate: '15deg'}]},
  skewBoxXS: {transform: [{skewX: '20deg'}, {scale: 1.1}]},
  skewBoxXT: {transform: [{skewX: '20deg'}, {translateX: 8}]},
});

exports.title = 'Transforms';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/transforms';
exports.description = 'View transforms';
exports.examples = [
  {
    title: 'Perspective, Rotate, Animation',
    description: 'perspective: 850, rotateX: Animated.timing(0 -> 360)',
    render(): React.Node {
      return <Flip />;
    },
  },
  {
    title: 'Translate, Rotate, Scale',
    name: 'translate-rotate-scale',
    description:
      "translateX: 100, translateY: 50, rotate: '30deg', scaleX: 2, scaleY: 2",
    render(): React.Node {
      return (
        <View
          testID="transform-translate-rotate-scale"
          style={styles.container}>
          <View style={styles.box1} />
        </View>
      );
    },
  },
  {
    title: 'Scale, Translate, Rotate, ',
    name: 'scale-translate-rotate',
    description:
      "scaleX: 2, scaleY: 2, translateX: 100, translateY: 50, rotate: '30deg'",
    render(): React.Node {
      return (
        <View
          testID="transform-scale-translate-rotate"
          style={styles.container}>
          <View style={styles.box2} />
        </View>
      );
    },
  },
  {
    title: 'Rotate',
    name: 'rotate',
    description: "rotate: '30deg'",
    render(): React.Node {
      return (
        <View testID="transform-rotate" style={styles.container}>
          <View style={styles.box3step1} />
        </View>
      );
    },
  },
  {
    title: 'Rotate, Scale',
    name: 'rotate-scale',
    description: "rotate: '30deg', scaleX: 2, scaleY: 2",
    render(): React.Node {
      return (
        <View testID="transform-rotate-scale" style={styles.container}>
          <View style={styles.box3step2} />
        </View>
      );
    },
  },
  {
    title: 'Rotate, Scale, Translate ',
    name: 'rotate-scale-translate',
    description:
      "rotate: '30deg', scaleX: 2, scaleY: 2, translateX: 100, translateY: 50",
    render(): React.Node {
      return (
        <View
          testID="transform-rotate-scale-translate"
          style={styles.container}>
          <View style={styles.box3step3} />
        </View>
      );
    },
  },
  {
    title: 'Translate, Scale, Rotate',
    name: 'translate-scale-rotate',
    description: "translate: [200, 350], scale: 2.5, rotate: '-0.2rad'",
    render(): React.Node {
      return (
        <View
          testID="transform-translate-scale-rotate"
          style={styles.container}>
          <View style={styles.box4} />
        </View>
      );
    },
  },
  {
    title: 'Translate, Rotate, Scale',
    name: 'translate-rotate-scale-2',
    description: "translate: [-50, 35], rotate: '50deg', scale: 2",
    render(): React.Node {
      return (
        <View
          testID="transform-translate-rotate-scale-2"
          style={styles.container}>
          <View style={[styles.box5, styles.box5Transform]} />
        </View>
      );
    },
  },
  {
    title: 'Animate Translate single prop',
    description: "rotate: '360deg'",
    render(): React.Node {
      return <AnimateTransformSingleProp />;
    },
  },
  {
    title: 'Transform using a string',
    name: 'string-transform',
    description: "transform: 'translate(-50px, 35px) rotate(50deg) scale(2)'",
    render(): React.Node {
      return (
        <View testID="transform-string" style={styles.container}>
          <View style={[styles.box7, styles.box7Transform]} />
        </View>
      );
    },
  },
  {
    title: 'Transform origin',
    description: "transformOrigin: 'top left'",
    render(): React.Node {
      return <TransformOriginExample />;
    },
  },
  {
    title: 'Translate Percentage',
    name: 'translate-percentage',
    description: "transform: 'translate(50%)'",
    render(): React.Node {
      return (
        <View testID="transform-translate-percentage">
          <TranslatePercentage />
        </View>
      );
    },
  },
  {
    title: 'Transform Matrix 2D',
    name: 'matrix-2d',
    description: "transform: 'matrix(1, 0, 0, 0, 1, 0, 0, 0, 1)'",
    render(): React.Node {
      return (
        <View testID="transform-matrix-2d">
          <TranslateMatrix2D />
        </View>
      );
    },
  },
  {
    title: 'Transform Matrix 3D',
    description:
      "transform: 'matrix(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)'",
    render(): React.Node {
      return <TranslateMatrix3D />;
    },
  },
  {
    title: 'Zero-scale hit test (regression for #50797)',
    name: 'scale-zero-hit-test',
    description:
      'A view with scaleY: 0 must not receive touches and must not inherit a sibling view’s hit region',
    render(): React.Node {
      return <ScaleZeroHitTestExample />;
    },
  },
  {
    title: 'Skew (#27649)',
    name: 'skew-27649',
    description:
      'skewX/skewY rendering, hit testing, and native-driven animation on Android Q+ and iOS',
    render(): React.Node {
      return <SkewExample />;
    },
  },
] as Array<RNTesterModuleExample>;
