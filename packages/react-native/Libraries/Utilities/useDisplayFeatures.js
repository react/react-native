/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Dimensions from './Dimensions';
import {type DisplayFeature} from './NativeDeviceInfo';
import {useEffect, useState} from 'react';

/**
 * React hook that provides the display features (such as a hinge or a
 * front-facing camera cutout) that content should avoid covering.
 * Automatically updates when the device pose changes.
 *
 * Returns an empty array on every platform today. iOS reserves this for the
 * iOS 27.1 SDK, which is not public as of 2026-09-10; see RCTDeviceInfo.mm.
 */
export default function useDisplayFeatures(): $ReadOnlyArray<DisplayFeature> {
  const [displayFeatures, setDisplayFeatures] = useState(() =>
    Dimensions.getDisplayFeatures(),
  );
  useEffect(() => {
    function handleChange() {
      setDisplayFeatures(Dimensions.getDisplayFeatures());
    }
    const subscription = Dimensions.addEventListener('change', handleChange);
    // We might have missed an update between calling `getDisplayFeatures` in
    // render and `addEventListener` in this handler.
    handleChange();
    return () => {
      subscription.remove();
    };
  }, []);
  return displayFeatures;
}
