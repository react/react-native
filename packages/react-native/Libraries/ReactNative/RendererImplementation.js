/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RootTag} from './RootTag';

import {
  onCaughtError,
  onRecoverableError,
  onUncaughtError,
} from '../../src/private/renderer/errorhandling/ErrorHandlers';
import ReactFabric from '../Renderer/shims/ReactFabric';
import * as React from 'react';

export function renderElement({
  element,
  rootTag,
}: {
  element: React.MixedElement,
  rootTag: RootTag,
}): void {
  ReactFabric.render(
    element,
    Number(rootTag),
    /* callback */ null,
    /* useConcurrentRoot */ true,
    {
      onCaughtError,
      onUncaughtError,
      onRecoverableError,
    },
  );
}

// NOTE: these cannot be combined into a single destructuring statement because
// `flow-api-translator` (used by `yarn build-types` to generate the
// open-source type definitions) does not support destructuring in variable
// declarations.
export const dispatchCommand = ReactFabric.dispatchCommand;
export const findHostInstance_DEPRECATED =
  ReactFabric.findHostInstance_DEPRECATED;
export const findNodeHandle = ReactFabric.findNodeHandle;
export const sendAccessibilityEvent = ReactFabric.sendAccessibilityEvent;
export const isChildPublicInstance = ReactFabric.isChildPublicInstance;
export const getNodeFromInternalInstanceHandle =
  ReactFabric.getNodeFromInternalInstanceHandle;
export const getPublicInstanceFromInternalInstanceHandle =
  ReactFabric.getPublicInstanceFromInternalInstanceHandle;
export const getPublicInstanceFromRootTag =
  ReactFabric.getPublicInstanceFromRootTag;

export function isProfilingRenderer(): boolean {
  return Boolean(__DEV__);
}
