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

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {DeviceEventEmitter, View} from 'react-native';

const OrientationChangeExample = (): React.Node => {
  const [state, setState] = useState({
    currentOrientation: '',
    orientationDegrees: 0,
    isLandscape: false,
  });

  useEffect(() => {
    const onOrientationChange = (orientation: Object) => {
      setState({
        currentOrientation: orientation.name,
        orientationDegrees: orientation.rotationDegrees,
        isLandscape: orientation.isLandscape,
      });
    };

    const orientationSubscription = DeviceEventEmitter.addListener(
      'namedOrientationDidChange',
      onOrientationChange,
    );

    return () => {
      orientationSubscription.remove();
    };
  }, []);

  return (
    <View>
      <RNTesterText>{JSON.stringify(state)}</RNTesterText>
    </View>
  );
};

exports.title = 'OrientationChangeExample';
exports.category = 'Basic';
exports.description = 'listening to orientation changes';
exports.examples = [
  {
    title: 'OrientationChangeExample',
    description: 'listening to device orientation changes',
    render(): React.Node {
      return <OrientationChangeExample />;
    },
  },
] as Array<RNTesterModuleExample>;
