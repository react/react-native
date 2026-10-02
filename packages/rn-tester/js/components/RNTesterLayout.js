/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// Caps lists and example frames to a readable, centered width on wide layouts
export const maxContentWidthStyle = {
  width: '100%',
  maxWidth: 600,
  alignSelf: 'center',
} as const;
