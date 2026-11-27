/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const RuntimeVersion: {hermes: string | void} = {
  hermes:
    global.HermesInternal?.getRuntimeProperties?.()?.['OSS Release Version'],
};

export default RuntimeVersion;
