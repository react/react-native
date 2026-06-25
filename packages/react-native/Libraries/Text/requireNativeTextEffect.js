/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Text from './Text';
import NativeTextEffect from './TextEffectNativeComponent';
import * as React from 'react';

export default function requireNativeTextEffect<P>(
  name: string,
): React.ComponentType<{...P, children: React.Node}> {
  component TextEffect(...props: {...P, children: React.Node}) {
    const {children, ...effectProps} = props;
    return (
      <NativeTextEffect effectName={name} effectProps={effectProps}>
        <Text>{children}</Text>
      </NativeTextEffect>
    );
  }
  TextEffect.displayName = `TextEffect(${name})`;
  return TextEffect;
}
