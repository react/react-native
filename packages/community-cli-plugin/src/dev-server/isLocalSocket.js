/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const IPV4_MAPPED_IPV6_PREFIX = '::ffff:';

/**
 * Whether a connection comes from the machine the dev server runs on.
 */
export default function isLocalSocket(socket: net$Socket): boolean {
  let {localAddress, remoteAddress, remoteFamily} = socket;

  if (localAddress != null && localAddress === remoteAddress) {
    return true;
  }
  if (remoteAddress == null || remoteFamily == null) {
    return false;
  }

  if (
    remoteFamily === 'IPv6' &&
    remoteAddress.startsWith(IPV4_MAPPED_IPV6_PREFIX)
  ) {
    remoteAddress = remoteAddress.slice(IPV4_MAPPED_IPV6_PREFIX.length);
  }

  return remoteAddress === '::1' || remoteAddress.startsWith('127.');
}
