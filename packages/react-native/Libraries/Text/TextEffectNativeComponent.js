/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../src/private/types/HostComponent';

import * as NativeComponentRegistry from '../NativeComponent/NativeComponentRegistry';
import * as React from 'react';

type NativeTextEffectProps = Readonly<{
  effectName?: ?string,
  effectProps?: ?Readonly<{readonly [string]: unknown}>,
  children?: React.Node,
}>;

const NativeTextEffect: HostComponent<NativeTextEffectProps> =
  NativeComponentRegistry.get<NativeTextEffectProps>('RCTTextEffect', () => ({
    validAttributes: {
      effectName: true,
      effectProps: true,
    },
    uiViewClassName: 'RCTTextEffect',
  }));

export default NativeTextEffect;
