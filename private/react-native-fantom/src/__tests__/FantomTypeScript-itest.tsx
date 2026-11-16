/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Text} from 'react-native';

type GreetingProps = Readonly<{name: string}>;

function Greeting({name}: GreetingProps): React.ReactNode {
  return <Text nativeID="greeting">Hello, {name}</Text>;
}

describe('a Fantom test written in TypeScript', () => {
  it('renders a component typed with TypeScript', () => {
    const root = Fantom.createRoot();
    const props = {name: 'Fantom'} satisfies GreetingProps;

    Fantom.runTask(() => {
      root.render(<Greeting {...props} />);
    });

    expect(root.getRenderedOutput({props: ['nativeID']}).toJSX()).toEqual(
      <rn-paragraph nativeID="greeting">Hello, Fantom</rn-paragraph>,
    );
  });
});
