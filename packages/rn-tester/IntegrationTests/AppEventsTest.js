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
import {
  NativeAppEventEmitter,
  NativeModules,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import deepDiffer from 'react-native/Libraries/Utilities/differ/deepDiffer';

const {TestModule} = NativeModules;

const TEST_PAYLOAD = {foo: 'bar'};

type AppEvent = {
  data: Object,
  ts: number,
};

type State = {
  sent: 'none' | AppEvent,
  received: 'none' | AppEvent,
  elapsed?: string,
};

function AppEventsTest(): React.Node {
  const [state, setState] = useState<State>({
    sent: 'none',
    received: 'none',
  });

  useEffect(() => {
    const receiveEvent = (event: any) => {
      if (deepDiffer(event.data, TEST_PAYLOAD)) {
        throw new Error('Received wrong event: ' + JSON.stringify(event));
      }
      const elapsed = Date.now() - event.ts + 'ms';
      setState(prevState => ({
        ...prevState,
        received: event,
        elapsed,
      }));
      TestModule.markTestCompleted();
    };

    const listener = NativeAppEventEmitter.addListener(
      'testEvent',
      receiveEvent,
    );

    const event = {data: TEST_PAYLOAD, ts: Date.now()};
    TestModule.sendAppEvent('testEvent', event);
    setState(prevState => ({...prevState, sent: event}));

    return () => {
      listener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text>{JSON.stringify(state, null, '  ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 40,
  },
});

export default AppEventsTest;
