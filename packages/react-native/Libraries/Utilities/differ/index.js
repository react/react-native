/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

/**
 * Collection of specialized comparison functions for React Native styling.
 * 
 * These utilities provide optimized equality checks for common data types
 * used in styling and layout calculations. They return true if values differ,
 * false if equal - opposite of standard equality comparisons.
 */

export {default as deepDiffer} from './deepDiffer';
export {default as matricesDiffer} from './matricesDiffer';
export {default as pointsDiffer} from './pointsDiffer';
export {default as sizesDiffer} from './sizesDiffer';
export {default as insetsDiffer} from './insetsDiffer';
