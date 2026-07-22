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

import * as React from 'react';
import {useEffect} from 'react';
import {NativeModules, View} from 'react-native';

const {TestModule, RNTesterTestModule} = NativeModules;

function SyncMethodTest(): React.Node {
  useEffect(() => {
    if (
      RNTesterTestModule.echoString('test string value') !== 'test string value'
    ) {
      throw new Error('Something wrong with echoString sync method');
    }
    if (RNTesterTestModule.methodThatReturnsNil() != null) {
      throw new Error('Something wrong with methodThatReturnsNil sync method');
    }
    let response;
    RNTesterTestModule.methodThatCallsCallbackWithString('test', echo => {
      response = echo;
    });
    requestAnimationFrame(() => {
      if (response === 'test') {
        TestModule.markTestCompleted();
      } else {
        throw new Error(
          'Something wrong with methodThatCallsCallbackWithString sync method, ' +
            'got response ' +
            JSON.stringify(response),
        );
      }
    });
  }, []);

  return <View />;
}

export default SyncMethodTest;
