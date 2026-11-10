/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {dlopen} from 'react-native/node-api';

const module: {exports: unknown} = {exports: {}};
dlopen(module, 'libaddon.so');

// @ts-expect-error filename is required
dlopen(module);

// @ts-expect-error module must have exports
dlopen({}, 'libaddon.so');
