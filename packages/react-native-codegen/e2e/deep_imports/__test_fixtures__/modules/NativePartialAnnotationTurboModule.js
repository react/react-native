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

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeObj = {
  a: string,
  b?: boolean,
};

export type PartialSomeObj = Partial<SomeObj>;

export interface Spec extends TurboModule {
  readonly getSomeObj: () => SomeObj;
  readonly getPartialSomeObj: () => Partial<SomeObj>;
  readonly getSomeObjFromPartialSomeObj: (value: Partial<SomeObj>) => SomeObj;
  readonly getPartialPartial: (
    value1: Partial<SomeObj>,
    value2: PartialSomeObj,
  ) => SomeObj;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativePartialAnnotationTurboModule',
) as Spec;
