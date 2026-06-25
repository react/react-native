/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Dimensions from '../../../../Libraries/Utilities/Dimensions';

export const DEFAULT_INITIAL_NUM_TO_RENDER = 7;

export const INITIAL_NUM_TO_RENDER: number = DEFAULT_INITIAL_NUM_TO_RENDER;

export const FALLBACK_ESTIMATED_HEIGHT: number =
  Dimensions.get('window').height / DEFAULT_INITIAL_NUM_TO_RENDER;

export const FALLBACK_ESTIMATED_WIDTH: number =
  Dimensions.get('window').width / DEFAULT_INITIAL_NUM_TO_RENDER;
