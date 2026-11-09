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
import styles from '../TurboModule/TurboModuleExampleCommon';
import * as React from 'react';
import {useState} from 'react';
import {DevSettings, Platform, TouchableOpacity, View} from 'react-native';
import {dlopen} from 'react-native/node-api';

type Addon = {
  hello: () => string,
  add: (a: number, b: number) => number,
  squareAsync: (n: number) => Promise<number>,
  tickFromThread: (count: number, callback: (i: number) => void) => void,
  envStats: () => {created: number, cleanedUp: number},
};

// Path construction is left to the caller, like with Node's process.dlopen.
const ADDON_FILENAME =
  Platform.OS === 'android'
    ? 'libnodeapiexample.so'
    : '@rpath/nodeapiexample.framework/nodeapiexample';

function loadAddon(): Addon {
  const module: {exports: any} = {exports: undefined};
  dlopen(module, ADDON_FILENAME);
  return module.exports;
}

function NodeApiExample(): React.Node {
  const [addon, setAddon] = useState<?Addon>(null);
  const [log, setLog] = useState<Array<string>>([]);

  const append = (line: string) => setLog(previous => [...previous, line]);
  const run = (label: string, action: (addon: Addon) => unknown) => {
    try {
      const loaded = addon ?? loadAddon();
      setAddon(loaded);
      const result = action(loaded);
      if (result instanceof Promise) {
        result.then(
          value => append(`${label} → ${String(value)}`),
          error => append(`${label} rejected: ${String(error)}`),
        );
      } else {
        append(`${label} → ${JSON.stringify(result) ?? 'undefined'}`);
      }
    } catch (error) {
      append(`${label} threw: ${String(error)}`);
    }
  };

  const actions: Array<[string, (addon: Addon) => unknown]> = [
    ['hello()', a => a.hello()],
    ['add(2, 3)', a => a.add(2, 3)],
    ['squareAsync(7)', a => a.squareAsync(7)],
    [
      'tickFromThread(3)',
      a => a.tickFromThread(3, i => append(`tick ${i} from thread`)),
    ],
    ['envStats()', a => a.envStats()],
  ];

  return (
    <View style={styles.container}>
      {actions.map(([label, action]) => (
        <View key={label} style={styles.item}>
          <TouchableOpacity
            testID={`node-api-${label}`}
            style={[styles.column, styles.button]}
            onPress={() => run(label, action)}>
            <RNTesterText style={styles.buttonText}>{label}</RNTesterText>
          </TouchableOpacity>
        </View>
      ))}
      <View style={styles.item}>
        <TouchableOpacity
          testID="node-api-reload"
          style={[styles.column, styles.button]}
          onPress={() => DevSettings.reload()}>
          <RNTesterText style={styles.buttonText}>Reload</RNTesterText>
        </TouchableOpacity>
      </View>
      {log.map((line, index) => (
        <RNTesterText key={index} testID={`node-api-log-${index}`}>
          {line}
        </RNTesterText>
      ))}
    </View>
  );
}

exports.displayName = undefined as ?string;
exports.title = 'Node-API';
exports.category = 'Basic';
exports.description = 'Loading a Node-API addon with dlopen';
exports.examples = [
  {
    title: 'Addon',
    render: (): React.MixedElement => <NodeApiExample />,
  },
] as Array<RNTesterModuleExample>;
