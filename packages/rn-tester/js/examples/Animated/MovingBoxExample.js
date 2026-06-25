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
import ToggleNativeDriver from './utils/ToggleNativeDriver';
import * as React from 'react';
import {useState} from 'react';
import {Animated, StyleSheet, Text, View, useAnimatedValue} from 'react-native';

const containerWidth = 200;
const boxSize = 50;

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
  container: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
  },
  boxContainer: {
    backgroundColor: '#d3d3d3',
    height: boxSize,
    width: containerWidth,
  },
  box: {
    width: boxSize,
    height: boxSize,
    margin: 0,
  },
  buttonsContainer: {
    marginTop: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: containerWidth,
  },
});

component MovingBoxView(useNativeDriver: boolean) {
  const x = useAnimatedValue(0);
  const [update, setUpdate] = useState(0);
  const [boxVisible, setBoxVisible] = useState(true);

  const moveTo = (pos: number) => {
    Animated.timing(x, {
      toValue: pos,
      duration: 1000,
      useNativeDriver,
    }).start();
  };

  const toggleVisibility = () => {
    setBoxVisible(!boxVisible);
  };
  const toggleText = boxVisible ? 'Hide' : 'Show';
  const onReset = () => {
    x.resetAnimation();
    setUpdate(update + 1);
  };
  return (
    <View style={styles.container}>
      <View testID="moving-view-track" style={styles.boxContainer}>
        {boxVisible ? (
          <Animated.View
            testID="moving-view"
            style={[styles.content, styles.box, {transform: [{translateX: x}]}]}
          />
        ) : (
          <Text>The box view is not being rendered</Text>
        )}
      </View>
      <View style={styles.buttonsContainer}>
        <RNTesterButton testID="move-left-button" onPress={() => moveTo(0)}>
          {'<-'}
        </RNTesterButton>
        <RNTesterButton onPress={toggleVisibility}>{toggleText}</RNTesterButton>
        <RNTesterButton onPress={onReset}>Reset</RNTesterButton>
        <RNTesterButton
          testID="move-right-button"
          onPress={() => moveTo(containerWidth - boxSize)}>
          {'->'}
        </RNTesterButton>
      </View>
    </View>
  );
}

component MovingBoxExample() {
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  return (
    <>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={setUseNativeDriver}
        />
      </RNTConfigurationBlock>
      <MovingBoxView
        key={`moving-box-view-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
      />
    </>
  );
}

export default {
  title: 'Moving box example',
  name: 'movingView',
  description:
    'Click arrow buttons to move the box. Hide will remove the box from layout.',
  expect:
    'During animation, removing box from layout will stop the animation and box will stay in its current position.\nStarting animation when box is not rendered and rendering mid-way does not affect animation.\nReset will reset the animation to its starting position.',
  render: (): React.Node => <MovingBoxExample />,
} as RNTesterModuleExample;
