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

import * as React from 'react';
import {useEffect, useState} from 'react';
import {TextInput, View} from 'react-native';

function TextInputKeyProp() {
  const [startKey, setStartKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setStartKey(startKey + 100), 3000);
    return () => clearInterval(interval);
  }, [startKey]);

  const textInputs = [];
  for (let i = 0; i < 101; i++) {
    const key = (startKey + i).toString();
    console.log('Adding a TextInput with key ' + key);
    textInputs.push(
      <TextInput
        style={{height: 40, borderColor: 'gray', borderWidth: 1}}
        key={key}
      />,
    );
  }

  return <View>{textInputs}</View>;
}

exports.title = 'TextInputs with key prop';
exports.description =
  'Periodically render large number of TextInputs with key prop without a Runtime Error';
exports.examples = [
  {
    title: 'Long List of TextInputs with key props',
    description:
      '100 TextInputs are added every 3 seconds to the View. #29452 avoids a NPE Runtime Error. If you want to trigger the Runtime, change 101 to 1001 in RNTester/TextInputKeyProp.js and use an Emulator with 8GB of RAM. This example is only meant to verify no RuntimeError is triggered. To test TextInput functionalities use the <TextInput> example.',
    render: function (): React.Node {
      return <TextInputKeyProp />;
    },
  },
] as Array<RNTesterModuleExample>;
