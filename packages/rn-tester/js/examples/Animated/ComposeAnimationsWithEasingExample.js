/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTConfigurationBlock from '../../components/RNTConfigurationBlock';
import RNTesterButton from '../../components/RNTesterButton';
import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import * as React from 'react';
import {useContext} from 'react';
import {Animated, Easing, StyleSheet, Text, View} from 'react-native';

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    padding: 20,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

component CompositeAnimationsWithEasingExample() {
  const anims = [1, 2, 3].map(() => new Animated.Value(0));
  const theme = useContext(RNTesterThemeContext);

  return (
    <View>
      <RNTConfigurationBlock>
        <Text style={{color: theme.SecondaryLabelColor}}>
          Note you cannot `useNativeDriver` for layout properties.
        </Text>
      </RNTConfigurationBlock>
      <RNTesterButton
        onPress={() => {
          Animated.sequence([
            // One after the other
            Animated.timing(anims[0], {
              toValue: 200,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.delay(400), // Use with sequence
            Animated.timing(anims[0], {
              toValue: 0,

              // Springy
              easing: Easing.elastic(2),

              useNativeDriver: false,
            }),
            Animated.delay(400),
            Animated.stagger(
              200,
              anims
                .map(anim =>
                  Animated.timing(anim, {
                    toValue: 200,
                    useNativeDriver: false,
                  }),
                )
                .concat(
                  anims.map(anim =>
                    Animated.timing(anim, {
                      toValue: 0,
                      useNativeDriver: false,
                    }),
                  ),
                ),
            ),
            Animated.delay(400),
            Animated.parallel(
              [
                Easing.inOut(Easing.quad), // Symmetric
                Easing.back(1.5), // Goes backwards first
                Easing.ease, // Default bezier
              ].map((easing, ii) =>
                Animated.timing(anims[ii], {
                  toValue: 320,
                  easing,
                  duration: 3000,
                  useNativeDriver: false,
                }),
              ),
            ),
            Animated.delay(400),
            Animated.stagger(
              200,
              anims.map(anim =>
                Animated.timing(anim, {
                  toValue: 0,

                  // Like a ball
                  easing: Easing.bounce,

                  duration: 2000,
                  useNativeDriver: false,
                }),
              ),
            ),
          ]).start();
        }}>
        Press to Animate
      </RNTesterButton>
      {['Composite', 'Easing', 'Animations!'].map((text, ii) => (
        <Animated.View
          key={text}
          style={[
            styles.content,
            {
              left: anims[ii],
            },
          ]}>
          <Text>{text}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

export default {
  title: 'Composite Animations with Easing',
  name: 'compositeAnimationsWithEasing',
  description: ('Sequence, parallel, delay, and ' +
    'stagger with different easing functions.') as string,
  expect:
    'The 3 views will animate their `left` position based on their animation configurations.',
  render: () => <CompositeAnimationsWithEasingExample />,
} as RNTesterModuleExample;
