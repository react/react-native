/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// In tests, we can use the default version without dependency injection.

import typeof * as TRendererImplementation from 'react-native/Libraries/ReactNative/RendererImplementation';

const {
  dispatchCommand,
  findHostInstance_DEPRECATED,
  findNodeHandle,
  getNodeFromInternalInstanceHandle,
  getPublicInstanceFromInternalInstanceHandle,
  getPublicInstanceFromRootTag,
  isChildPublicInstance,
  isProfilingRenderer,
  renderElement,
  sendAccessibilityEvent,
} = jest.requireActual<TRendererImplementation>(
  'react-native/Libraries/ReactNative/RendererImplementation',
) as TRendererImplementation;

export {
  dispatchCommand,
  findHostInstance_DEPRECATED,
  findNodeHandle,
  getNodeFromInternalInstanceHandle,
  getPublicInstanceFromInternalInstanceHandle,
  getPublicInstanceFromRootTag,
  isChildPublicInstance,
  isProfilingRenderer,
  renderElement,
  sendAccessibilityEvent,
};
