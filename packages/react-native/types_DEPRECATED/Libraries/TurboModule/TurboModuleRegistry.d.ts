/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {TurboModule} from './RCTExport';

export function get<T extends TurboModule>(name: string): T | null;
export function getEnforcing<T extends TurboModule>(name: string): T;
