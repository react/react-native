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

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {View} from 'react-native';

export const title = 'Invalid Props';
export const category = 'Other';
export const description =
  'Examples of passing invalid prop values and how they fall back to expected defaults.';

export const examples: Array<RNTesterModuleExample> = [
  {
    title: 'View flex',
    render(): React.Node {
      return (
        <Comparison actual={[1]} expected={undefined}>
          {flex => (
            <View style={{height: 50}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {
                    flex,
                    backgroundColor: 'red',
                  }
                }
              />
              <View style={{flex: 1, backgroundColor: 'lightgreen'}} />
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'View flexDirection',
    render(): React.Node {
      return (
        <Comparison actual={'row.'} expected={undefined}>
          {flexDirection => (
            <View
              // $FlowFixMe[incompatible-type]
              style={{flexDirection}}>
              <RNTesterText>⬇️</RNTesterText>
              <RNTesterText>⬇️</RNTesterText>
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'Text fontVariant',
    render(): React.Node {
      return (
        <Comparison
          actual={['no-such-variant', 'small-caps-12345']}
          expected={undefined}>
          {fontVariant => (
            <RNTesterText
              // $FlowFixMe[incompatible-type]
              style={{fontVariant}}>
              The quick brown fox jumps over the lazy dog.
            </RNTesterText>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'View width',
    render(): React.Node {
      return (
        <Comparison actual={['invalid']} expected={undefined}>
          {width => (
            <View style={{backgroundColor: 'red'}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {width, height: 50, backgroundColor: 'lightgreen'}
                }
              />
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'View background color',
    render(): React.Node {
      return (
        <Comparison actual={['invalid']} expected={undefined}>
          {backgroundColor => (
            <View style={{backgroundColor: 'lightgreen'}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {backgroundColor, height: 50}
                }
              />
            </View>
          )}
        </Comparison>
      );
    },
  },
  {
    title: 'Malformed platform color',
    render(): React.Node {
      return (
        <Comparison
          actual={{resource_paths: [] as Array<string>}}
          expected={undefined}>
          {backgroundColor => (
            <View style={{backgroundColor: 'lightgreen'}}>
              <View
                style={
                  // $FlowFixMe[incompatible-type]
                  {backgroundColor, height: 50}
                }
              />
            </View>
          )}
        </Comparison>
      );
    },
  },
];

function Comparison<ExpectedT, ActualT>({
  children,
  actual,
  expected,
}: {
  children: (value: ExpectedT | ActualT) => React.Node,
  actual: ActualT,
  expected: ExpectedT,
}): React.Node {
  return (
    <>
      <RNTesterText style={{fontWeight: 'bold'}}>Actual</RNTesterText>
      {children(actual)}
      <RNTesterText style={{fontWeight: 'bold'}}>Expected</RNTesterText>
      {children(expected)}
    </>
  );
}
