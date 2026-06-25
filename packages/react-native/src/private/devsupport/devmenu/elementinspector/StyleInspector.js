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

import type {ViewStyleProp} from '../../../../../Libraries/StyleSheet/StyleSheet';
import type {____FlattenStyleProp_Internal} from '../../../../../Libraries/StyleSheet/StyleSheetTypes';

import * as React from 'react';

const View = require('../../../../../Libraries/Components/View/View').default;
const StyleSheet =
  require('../../../../../Libraries/StyleSheet/StyleSheet').default;
const Text = require('../../../../../Libraries/Text/Text').default;

type Props = Readonly<{
  style?: ?____FlattenStyleProp_Internal<ViewStyleProp>,
}>;

function StyleInspector({style}: Props): React.Node {
  if (!style) {
    return <Text style={styles.noStyle}>No style</Text>;
  }
  const names = Object.keys(style);
  return (
    <View style={styles.container}>
      <View>
        {names.map(name => (
          <Text key={name} style={styles.attr}>
            {name}:
          </Text>
        ))}
      </View>

      <View>
        {names.map(name => {
          const value = style?.[name];
          return (
            <Text key={name} style={styles.value}>
              {typeof value !== 'string' && typeof value !== 'number'
                ? JSON.stringify(value)
                : value}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  attr: {
    fontSize: 10,
    color: '#ccc',
  },
  value: {
    fontSize: 10,
    color: 'white',
    marginLeft: 10,
  },
  noStyle: {
    color: 'white',
    fontSize: 10,
  },
});

export default StyleInspector;
