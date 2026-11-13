/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Text, TextInput, View} from 'react-native';

type Kind = 'short text' | 'wrapped text' | 'input' | 'multiline input';
type BenchmarkCase = {
  kind: Kind,
  count: number,
};

const kinds: Array<Kind> = [
  'short text',
  'wrapped text',
  'input',
  'multiline input',
];
const cases: Array<BenchmarkCase> = [];
for (const kind of kinds) {
  for (const count of [100, 1000]) {
    cases.push({kind, count});
  }
}

const paragraph =
  'Fantom measures text using the same font metrics as its screenshot painter. This paragraph wraps across several lines without an explicit height.';

function createElements(kind: Kind, count: number): React.MixedElement {
  const createElement = {
    'short text': (i: number) => <Text key={i}>{`Text instance ${i}`}</Text>,
    'wrapped text': (i: number) => (
      <Text key={i} style={{width: 240}}>{`${paragraph} ${i}`}</Text>
    ),
    input: (i: number) => <TextInput key={i} value={`Input instance ${i}`} />,
    'multiline input': (i: number) => (
      <TextInput
        key={i}
        multiline
        style={{width: 240}}
        value={`${paragraph}\nInput instance ${i}`}
      />
    ),
  }[kind];
  return (
    <View style={{alignItems: 'flex-start'}}>
      {Array.from({length: count}, (_, i) => createElement(i))}
    </View>
  );
}

let root;
let elements: React.MixedElement;

Fantom.unstable_benchmark
  .suite('Text measurement')
  .test.each(
    cases,
    ({kind, count}) => `render ${count} ${kind} components`,
    () => {
      Fantom.runTask(() => root.render(elements));
    },
    ({kind, count}) => ({
      beforeAll: () => {
        elements = createElements(kind, count);
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  )
  .test(
    'create root',
    () => {
      root = Fantom.createRoot();
    },
    {
      afterEach: () => {
        root.destroy();
      },
    },
  );
