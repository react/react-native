/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {HostInstance} from '../..';
import type {AbstractImageAndroid, AbstractImageIOS} from './ImageTypes.flow';

import useMergeRefs from '../Utilities/useMergeRefs';
import * as React from 'react';
import {useCallback} from 'react';

type ImageComponentDecorator = (AbstractImageAndroid => AbstractImageAndroid) &
  (AbstractImageIOS => AbstractImageIOS);

let injectedImageComponentDecorator: ?ImageComponentDecorator;

export function unstable_setImageComponentDecorator(
  imageComponentDecorator: ?ImageComponentDecorator,
): void {
  injectedImageComponentDecorator = imageComponentDecorator;
}

export function unstable_getImageComponentDecorator(): ?ImageComponentDecorator {
  return injectedImageComponentDecorator;
}

type ImageInstance = HostInstance;

type ImageAttachedCallback = (
  imageInstance: ImageInstance,
) => void | (() => void);

const imageAttachedCallbacks = new Set<ImageAttachedCallback>();

export function unstable_registerImageAttachedCallback(
  callback: ImageAttachedCallback,
): void {
  imageAttachedCallbacks.add(callback);
}

export function unstable_unregisterImageAttachedCallback(
  callback: ImageAttachedCallback,
): void {
  imageAttachedCallbacks.delete(callback);
}

export function useWrapRefWithImageAttachedCallbacks(
  forwardedRef: React.RefSetter<ImageInstance>,
): React.RefSetter<ImageInstance> {
  const attachCallback = useCallback((node: ImageInstance) => {
    const pendingCleanup = [];
    imageAttachedCallbacks.forEach(imageAttachedCallback => {
      const maybeCleanupCallback = imageAttachedCallback(node);
      if (maybeCleanupCallback != null) {
        pendingCleanup.push(maybeCleanupCallback);
      }
    });
    return () => pendingCleanup.forEach(cb => cb());
  }, []);

  // `useMergeRefs` returns a stable ref if its arguments don't change.
  return useMergeRefs<ImageInstance>(
    forwardedRef,
    // $FlowFixMe[incompatible-type] - blocked on refined refsetter types
    attachCallback as React.RefSetter<ImageInstance>,
  );
}
