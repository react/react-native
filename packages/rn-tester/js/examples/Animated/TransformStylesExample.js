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
import RNTOption from '../../components/RNTOption';
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import * as React from 'react';
import {useContext, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

const transformProperties = {
  rotate: {outputRange: ['0deg', '360deg'], selected: false},
  rotateX: {outputRange: ['0deg', '360deg'], selected: false},
  rotateY: {outputRange: ['0deg', '360deg'], selected: false},
  rotateZ: {outputRange: ['0deg', '360deg'], selected: false},
  skewX: {outputRange: ['0deg', '45deg'], selected: false},
  skewY: {outputRange: ['0deg', '45deg'], selected: false},
  perspective: {outputRange: [1, 2], selected: false},
  scale: {outputRange: [1, 3], selected: false},
  scaleX: {outputRange: [1, 3], selected: false},
  scaleY: {outputRange: [1, 3], selected: false},
  translateX: {outputRange: [0, 100], selected: false},
  translateY: {outputRange: [0, 100], selected: false},
};

component AnimatedView(properties: Array<string>, useNativeDriver: boolean) {
  const animatedValue = new Animated.Value(0);
  const transformStyles = properties.map(property => ({
    [property]: animatedValue.interpolate({
      inputRange: [0, 1],
      // $FlowFixMe[invalid-computed-prop]
      outputRange: transformProperties[property].outputRange,
    }),
  }));
  const animation = Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 500,
      useNativeDriver,
    }),
  ]);
  return (
    <>
      <RNTesterButton
        onPress={() => {
          animation.reset();
          animation.start();
        }}>
        Apply Selected Transforms
      </RNTesterButton>
      <Animated.View
        // $FlowFixMe[incompatible-type] - properties are not exact
        style={[styles.animatedView, {transform: transformStyles}]}
      />
    </>
  );
}

component AnimatedTransformStyleExample() {
  const [properties, setProperties] = useState(transformProperties);
  const [useNativeDriver, setUseNativeDriver] = useState(false);
  const onToggle = (property: string) =>
    // $FlowFixMe[incompatible-type]
    setProperties({
      ...properties,
      [property]: {
        // $FlowFixMe[invalid-computed-prop]
        ...properties[property],
        // $FlowFixMe[invalid-computed-prop]
        selected: !properties[property].selected,
      },
    });
  const theme = useContext(RNTesterThemeContext);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
          style={StyleSheet.compose(styles.bottomSeparation, {
            borderBottomColor: theme.SeparatorColor,
          })}
        />
        <Text style={[styles.optionsTitle, {color: theme.SecondaryLabelColor}]}>
          Selected Styles
        </Text>
        <View style={styles.options}>
          {Object.keys(properties).map(property => {
            return (
              <RNTOption
                key={property}
                label={property}
                multiSelect
                selected={properties[property].selected}
                onPress={() => {
                  onToggle(property);
                }}
                style={styles.option}
              />
            );
          })}
        </View>
      </RNTConfigurationBlock>
      <AnimatedView
        key={`animated-view-use-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
        // $FlowFixMe[incompatible-type]
        properties={Object.keys(properties).filter(
          property => properties[property].selected,
        )}
      />
      <View style={styles.section}>
        <Text style={{color: theme.SecondaryLabelColor}}>
          {'Should not crash when transform style key is undefined'}
        </Text>
        <Animated.View style={[styles.animatedView, {transform: undefined}]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  optionsTitle: {
    marginTop: 4,
    marginBottom: 6,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    margin: 2,
  },
  animatedView: {
    height: 100,
    width: 100,
    backgroundColor: 'blue',
  },
  bottomSeparation: {
    paddingBottom: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
  },
  section: {
    marginTop: 20,
  },
});

export default {
  title: 'Transform Styles',
  name: 'transformStyles',
  description: 'Variations of transform styles.',
  render: () => <AnimatedTransformStyleExample />,
} as RNTesterModuleExample;
