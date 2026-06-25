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
import type {PartialViewConfig} from '../../Renderer/shims/ReactNativeTypes';
import type {TextInputNativeCommands} from './TextInputNativeCommands';

import * as NativeComponentRegistry from '../../NativeComponent/NativeComponentRegistry';
import codegenNativeCommands from '../../Utilities/codegenNativeCommands';
import RCTTextInputViewConfig from './RCTTextInputViewConfig';

type NativeType = HostComponent<{...}>;

type NativeCommands = TextInputNativeCommands<NativeType>;

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['focus', 'blur', 'setTextAndSelection'],
});

export const __INTERNAL_VIEW_CONFIG: PartialViewConfig = {
  uiViewClassName: 'RCTMultilineTextInputView',
  ...RCTTextInputViewConfig,
  validAttributes: {
    ...RCTTextInputViewConfig.validAttributes,
    dataDetectorTypes: true,
  },
};

const MultilineTextInputNativeComponent: HostComponent<{...}> =
  NativeComponentRegistry.get<{...}>(
    'RCTMultilineTextInputView',
    () => __INTERNAL_VIEW_CONFIG,
  );

// flowlint-next-line unclear-type:off
export default MultilineTextInputNativeComponent as any as HostComponent<{...}>;
