/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostComponent} from '../../../src/private/types/HostComponent';
import type {ViewProps} from '../View/ViewPropTypes';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';

type Props = Readonly<{
  mode: 'strict' | 'compatibility',
  ...ViewProps,
}>;

const LayoutConformanceNativeComponent: HostComponent<Props> =
  NativeComponentRegistry.get<Props>('LayoutConformance', () => ({
    uiViewClassName: 'LayoutConformance',
    validAttributes: {
      mode: true,
    },
  }));

export default LayoutConformanceNativeComponent;
