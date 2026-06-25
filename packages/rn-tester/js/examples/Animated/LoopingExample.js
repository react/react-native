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
import {useEffect, useMemo, useState} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

export default {
  title: 'Looping Example',
  name: 'loopingView',
  description: 'Native looping animation that shrinks and fades out a view.',
  render: () => <LoopingExample />,
} as RNTesterModuleExample;

component LoopingView(useNativeDriver: boolean, running: boolean) {
  const opacity = useMemo(() => new Animated.Value(1), []);
  const scale = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const options = {
      duration: 1000,
      toValue: 0,
      useNativeDriver,
    };
    const animation = Animated.loop(
      Animated.parallel([
        Animated.timing(opacity, options),
        Animated.timing(scale, options),
      ]),
    );
    animation.start();

    return () => {
      animation.reset();
    };
  }, [opacity, scale, running, useNativeDriver]);

  return (
    <Animated.View style={[styles.view, {opacity, transform: [{scale}]}]}>
      <Text>Looping!</Text>
    </Animated.View>
  );
}

component LoopingExample() {
  const [running, setRunning] = useState(false);
  const [useNativeDriver, setUseNativeDriver] = useState(false);

  return (
    <View>
      <RNTConfigurationBlock>
        <ToggleNativeDriver
          value={useNativeDriver}
          onValueChange={value => {
            setRunning(false);
            setUseNativeDriver(value);
          }}
        />
      </RNTConfigurationBlock>
      <RNTesterButton onPress={() => setRunning(!running)}>
        Press to {running ? 'Reset' : 'Start'}
      </RNTesterButton>
      <LoopingView
        key={`looping-view-${useNativeDriver ? 'native' : 'js'}-driver`}
        useNativeDriver={useNativeDriver}
        running={running}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  view: {
    backgroundColor: 'deepskyblue',
    borderWidth: 1,
    borderColor: 'dodgerblue',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    margin: 20,
  },
});
