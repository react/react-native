/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {HostComponent} from '../../src/private/types/HostComponent';
import type {HostInstance} from '../../src/private/types/HostInstance';

import * as React from 'react';

function takesHostComponentInstance(instance: HostInstance | null): void {}

const MyHostComponent = 'Host' as any as HostComponent<{...}>;

<MyHostComponent
  ref={hostComponentRef => {
    takesHostComponentInstance(hostComponentRef);

    if (hostComponentRef == null) {
      return;
    }

    hostComponentRef.measureLayout(hostComponentRef, () => {});
  }}
/>;
