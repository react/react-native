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

import * as React from 'react';
import {useState} from 'react';
import {Animated, Button, Text, View, useAnimatedValue} from 'react-native';

const componentList: number[] = Array.from({length: 100}, (_, i) => i + 1);

component PressableWithNativeDriver() {
  const currScroll = useAnimatedValue(0);
  const [count, setCount] = useState(0);

  return (
    <View style={{flex: 1}}>
      <Animated.View
        style={{
          position: 'absolute',
          zIndex: 2,
          width: '100%',
          transform: [{translateY: currScroll}],
        }}>
        <Button
          title={`Press count : ${count}`}
          onPress={() => {
            console.log('pressed');
            setCount(count + 1);
          }}
        />
      </Animated.View>
      <Animated.FlatList
        style={{width: '100%', height: '100%', position: 'absolute', zIndex: 1}}
        data={componentList}
        renderItem={({index}) => (
          <Text
            style={{
              backgroundColor: 'white',
              height: 28,
            }}>
            {index}
          </Text>
        )}
        keyExtractor={item => item.toString()}
        onScroll={Animated.event(
          [
            {
              nativeEvent: {
                contentOffset: {
                  y: currScroll,
                },
              },
            },
          ],
          {useNativeDriver: true},
        )}
      />
    </View>
  );
}

export default {
  title: 'Pressability With Native Driver',
  name: 'pressabilityWithNativeDrivers',
  description: 'Pressabile animated with Native Drivers',
  render: () => <PressableWithNativeDriver />,
} as RNTesterModuleExample;
