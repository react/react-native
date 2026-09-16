/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getViewTransitionInstance: (
    name: string,
    pseudo: string,
  ) => ?{
    x: number,
    y: number,
    width: number,
    height: number,
    nativeTag: number,
  };
  readonly findPseudoElementShadowNodeByTag: (
    reactTag: number,
  ) => ?unknown; /* Node */
  readonly waitForTransitionAnimation: (animationId: number) => void;
  readonly transitionAnimationFinished: (animationId: number) => void;
}

export default TurboModuleRegistry.get<Spec>(
  'NativeViewTransitionCxx',
) as ?Spec;
