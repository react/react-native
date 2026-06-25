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

import * as MutationObserverExample from './MutationObserverExample';
import * as VisualCompletionExample from './VisualCompletionExample/VisualCompletionExample';

export const framework = 'React';
export const title = 'MutationObserver';
export const category = 'UI';
export const documentationURL =
  'https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver';
export const description = 'API to detect mutations in React Native nodes.';
export const showIndividualExamples = true;
export const examples: Array<RNTesterModuleExample> = [MutationObserverExample];

if (typeof IntersectionObserver !== 'undefined') {
  examples.push(VisualCompletionExample);
}
