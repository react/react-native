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
import {Image, NativeModules} from 'react-native';

const {TestModule} = NativeModules;

function ImageSnapshotTest(): React.Node {
  useEffect(() => {
    if (!TestModule.verifySnapshot) {
      throw new Error('TestModule.verifySnapshot not defined.');
    }
  }, []);

  const done = (success: boolean) => {
    TestModule.markTestPassed(success);
  };

  return (
    <Image
      source={require('./blue_square.png')}
      defaultSource={require('./red_square.png')}
      onLoad={() => TestModule.verifySnapshot(done)}
    />
  );
}

export default ImageSnapshotTest;
