/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../../types/RNTesterTypes';
import type {PointerEvent} from 'react-native';

import * as React from 'react';
import {useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';

const styles = StyleSheet.create({
  container: {height: '30%', width: '100%', backgroundColor: 'black'},
  properties: {},
  property: {borderWidth: 1, margin: 10},
});

function getModifiersText(evt: PointerEvent['nativeEvent']): string {
  const modifiers = [];
  if (evt.ctrlKey === true) {
    modifiers.push('Ctrl');
  }
  if (evt.shiftKey === true) {
    modifiers.push('Shift');
  }
  if (evt.altKey === true) {
    modifiers.push('Alt');
  }
  if (evt.metaKey === true) {
    modifiers.push('Meta');
  }

  if (modifiers.length > 0) {
    return modifiers.join(', ');
  }

  return '<none>';
}

function ManyPointersPropertiesExample(): React.Node {
  const [data, setData] = useState<{}>({});
  const onPointerMove = (event: PointerEvent) => {
    const pointerId = event.nativeEvent.pointerId;
    // $FlowFixMe[invalid-computed-prop]
    // $FlowFixMe[incompatible-type]
    setData({...data, [pointerId]: event.nativeEvent});
  };

  return (
    <>
      <View style={styles.container} onPointerMove={onPointerMove} />
      <View style={styles.properties}>
        {Object.entries(data).map(
          //$FlowFixMe[incompatible-type] can't supply generic for Object.entries
          ([key, evt]: [string, PointerEvent['nativeEvent']]) => (
            <View style={styles.property} key={key}>
              <Text>PointerID: {evt.pointerId}</Text>
              <Text>
                Offset: [{evt.offsetX.toPrecision(3)},{' '}
                {evt.offsetY.toPrecision(3)}]
              </Text>
              <Text>
                Coordinates: [{evt.clientX.toPrecision(3)},{' '}
                {evt.clientY.toPrecision(3)}]
              </Text>
              <Text>
                Screen Coordinates: [{evt.screenX?.toPrecision(3)},{' '}
                {evt.screenY?.toPrecision(3)}]
              </Text>
              <Text>Button: {evt.button}</Text>
              <Text>Pressure: {evt.pressure}</Text>
              <Text>Modifiers: {getModifiersText(evt)}</Text>
            </View>
          ),
        )}
      </View>
    </>
  );
}

export default {
  name: 'many_pointers_properties_example',
  description: 'Display of properties for multiple pointers',
  title: 'Display Properties of many pointers',
  render(): React.Node {
    return <ManyPointersPropertiesExample />;
  },
} as RNTesterModuleExample;
