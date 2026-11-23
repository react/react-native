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

import RNTesterText from '../../components/RNTesterText';

const React = require('react');
const {Alert, TouchableOpacity, View} = require('react-native');

class TransparentHitTestExample extends React.Component<{...}> {
  render(): React.Node {
    return (
      <View style={{flex: 1}}>
        <TouchableOpacity onPress={() => Alert.alert('Alert', 'Hi!')}>
          <RNTesterText>HELLO!</RNTesterText>
        </TouchableOpacity>

        <View
          style={{
            position: 'absolute',
            backgroundColor: 'green',
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            opacity: 0.0,
          }}
        />
      </View>
    );
  }
}
exports.title = 'TransparentHitTestExample';
exports.category = 'UI';
exports.displayName = 'TransparentHitTestExample';
exports.description = 'Transparent view receiving touch events';
exports.examples = [
  {
    title: 'TransparentHitTestExample',
    render(): React.MixedElement {
      return <TransparentHitTestExample />;
    },
  },
] as Array<RNTesterModuleExample>;
