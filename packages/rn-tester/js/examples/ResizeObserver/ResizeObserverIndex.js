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

import * as ResizeObserverBoxSizesExample from './ResizeObserverBoxSizesExample';
import * as ResizeObserverTextExample from './ResizeObserverTextExample';
import * as ResizeObserverVisibilityExample from './ResizeObserverVisibilityExample';

export const framework = 'React';
export const title = 'ResizeObserver';
export const category = 'UI';
export const documentationURL =
  'https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver';
export const description =
  'API to observe changes to the dimensions of an element and report its ' +
  'content-box, border-box, and device-pixel-content-box sizes.';
export const showIndividualExamples = true;
export const examples: Array<RNTesterModuleExample> = [
  ResizeObserverTextExample,
  ResizeObserverBoxSizesExample,
  ResizeObserverVisibilityExample,
];
