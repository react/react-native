/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';
import {View} from 'react-native';

component Layer(
  left: number,
  top: number,
  backgroundColor: string,
  zIndex: number,
) {
  return (
    <View
      style={{
        position: 'absolute',
        left,
        top,
        width: 60,
        height: 48,
        backgroundColor,
        zIndex,
      }}
    />
  );
}

export component StackingScene(zIndex: number) {
  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <Layer left={12} top={12} backgroundColor="#3978b4" zIndex={0} />
      <Layer left={32} top={22} backgroundColor="#36a379" zIndex={0} />
      <Layer left={52} top={32} backgroundColor="#e9a13b" zIndex={zIndex} />
      <Layer left={72} top={42} backgroundColor="#d05b39" zIndex={-2} />
      <View
        style={{
          position: 'absolute',
          left: 12,
          top: 100,
          width: 72,
          height: 40,
          backgroundColor: '#3978b4',
          zIndex: 1,
        }}>
        <Layer left={36} top={-8} backgroundColor="#d05b39" zIndex={100} />
      </View>
      <Layer left={72} top={92} backgroundColor="#36a379" zIndex={2} />
    </View>
  );
}

export component OverflowScene(overflow: 'visible' | 'hidden') {
  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <View
        style={{
          position: 'absolute',
          left: 24,
          top: 24,
          width: 100,
          height: 90,
          borderWidth: 4,
          borderColor: '#3978b4',
          borderRadius: 24,
          backgroundColor: '#dbeaf5',
          overflow,
        }}>
        <View
          style={{
            position: 'absolute',
            left: -16,
            top: -12,
            width: 80,
            height: 48,
            opacity: 0.75,
            backgroundColor: '#d05b39',
            transform: [{rotate: '15deg'}],
          }}
        />
        <View style={{position: 'absolute', left: 76, top: 60}}>
          <Layer left={0} top={0} backgroundColor="#8654a5" zIndex={0} />
        </View>
      </View>
      <Layer left={132} top={104} backgroundColor="#36a379" zIndex={0} />
    </View>
  );
}

export component AbsolutePositionScene() {
  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <View
        style={{
          left: 20,
          top: 20,
          width: 140,
          height: 120,
          borderWidth: 6,
          borderColor: '#3978b4',
          padding: 14,
          backgroundColor: '#dbeaf5',
        }}>
        <View
          style={{
            position: 'absolute',
            top: 8,
            left: 12,
            right: 12,
            height: 24,
            backgroundColor: '#8654a5',
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: -8,
            right: -10,
            width: '40%',
            height: '30%',
            backgroundColor: '#e9a13b',
          }}
        />
        <View style={{width: 32, height: 32, backgroundColor: '#36a379'}} />
      </View>
    </View>
  );
}

export component TransformScene() {
  return (
    <View style={{flex: 1, backgroundColor: 'white'}}>
      <View
        style={{
          position: 'absolute',
          left: 20,
          top: 20,
          width: 40,
          height: 24,
          borderWidth: 3,
          borderColor: '#8654a5',
          backgroundColor: '#3978b4',
          transform: [{rotate: '25deg'}, {scaleX: -1}],
        }}>
        <View
          style={{
            position: 'absolute',
            left: 2,
            top: 1,
            width: 8,
            height: 8,
            backgroundColor: '#e9a13b',
          }}
        />
      </View>
      <View
        style={{
          position: 'absolute',
          left: 100,
          top: 20,
          width: 40,
          height: 24,
          backgroundColor: '#d05b39',
          transform: [{scale: 0}],
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: 20,
          top: 80,
          width: 80,
          height: 20 + 1 / 3,
        }}>
        <View
          style={{
            position: 'absolute',
            left: 12.5,
            top: -4.5,
            width: 40,
            height: 30,
            opacity: 0.45,
            backgroundColor: '#e9a13b',
            transform: [{translateX: 9.25}, {rotate: '15deg'}],
          }}
        />
      </View>
      <Layer left={100} top={80} backgroundColor="#36a379" zIndex={0} />
      <View
        style={{
          position: 'absolute',
          left: 100,
          top: 140,
          width: 40,
          height: 20,
          backgroundColor: '#3978b4',
          transform: [
            {translateX: 4},
            {scaleX: 1.4},
            {scaleY: 0.65},
            {skewX: '12deg'},
          ],
        }}>
        <View style={{width: 8, height: 12, backgroundColor: '#e9a13b'}} />
      </View>
    </View>
  );
}
