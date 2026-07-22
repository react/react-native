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

import * as React from 'react';
import {useEffect, useState} from 'react';
import {NativeModules, StyleSheet, Text, View} from 'react-native';

const {TestModule} = NativeModules;

type Props = Readonly<{
  shouldThrow?: boolean,
  waitOneFrame?: boolean,
}>;

function IntegrationTestHarnessTest(props: Props): React.Node {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const runTest = () => {
      if (props.shouldThrow) {
        throw new Error('Throwing error because shouldThrow');
      }
      if (!TestModule) {
        throw new Error('RCTTestModule is not registered.');
      } else if (!TestModule.markTestCompleted) {
        throw new Error('RCTTestModule.markTestCompleted not defined.');
      }
      setDone(true);
      TestModule.markTestCompleted();
    };

    if (props.waitOneFrame) {
      requestAnimationFrame(runTest);
    } else {
      runTest();
    }
  }, [props.shouldThrow, props.waitOneFrame]);

  return (
    <View style={styles.container}>
      <Text>
        {IntegrationTestHarnessTest.name + ': '}
        {done ? 'Done' : 'Testing...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 40,
  },
});

export default IntegrationTestHarnessTest;
