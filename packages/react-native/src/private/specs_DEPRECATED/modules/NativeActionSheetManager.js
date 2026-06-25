/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getConstants: () => {};
  readonly showActionSheetWithOptions: (
    options: {
      readonly title?: ?string,
      readonly message?: ?string,
      readonly options: ?Array<string>,
      readonly destructiveButtonIndices?: ?Array<number>,
      readonly cancelButtonIndex?: ?number,
      readonly anchor?: ?number,
      readonly tintColor?: ?number,
      readonly cancelButtonTintColor?: ?number,
      readonly disabledButtonTintColor?: ?number,
      readonly userInterfaceStyle?: ?string,
      readonly disabledButtonIndices?: Array<number>,
    },
    callback: (buttonIndex: number) => void,
  ) => void;
  readonly showShareActionSheetWithOptions: (
    options: {
      readonly message?: ?string,
      readonly url?: ?string,
      readonly subject?: ?string,
      readonly anchor?: ?number,
      readonly tintColor?: ?number,
      readonly cancelButtonTintColor?: ?number,
      readonly disabledButtonTintColor?: ?number,
      readonly excludedActivityTypes?: ?Array<string>,
      readonly userInterfaceStyle?: ?string,
    },
    failureCallback: (error: {
      readonly domain: string,
      readonly code: string,
      readonly userInfo?: ?Object,
      readonly message: string,
    }) => void,
    successCallback: (completed: boolean, activityType: ?string) => void,
  ) => void;
  readonly dismissActionSheet?: () => void;
}

export default TurboModuleRegistry.get<Spec>('ActionSheetManager') as ?Spec;
