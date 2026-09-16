/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostPlatform} from '../src/Constants';

/**
 * Returns the host OS Fantom is running on (the Node process platform), mapped
 * to the `HostPlatform` values used by the Fantom runtime constants.
 */
export default function getHostPlatform(): HostPlatform {
  match (process.platform) {
    'darwin' => {
      return 'macos';
    }
    'win32' => {
      return 'windows';
    }
    'linux' => {
      return 'linux';
    }
    'android' => {
      return 'android';
    }
    _ => {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }
}
