/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import ModalBlurBehind from './ModalBlurBehind';
import ModalOnShow from './ModalOnShow';
import ModalPresentation from './ModalPresentation';

export const displayName: ?string = undefined;
export const framework = 'React';
export const title = 'Modal';
export const category = 'UI';
export const documentationURL = 'https://reactnative.dev/docs/modal';
export const description = 'Component for presenting modal views.';
export const examples: Array<RNTesterModuleExample> = [
  ModalPresentation,
  ModalOnShow,
  ModalBlurBehind,
];
