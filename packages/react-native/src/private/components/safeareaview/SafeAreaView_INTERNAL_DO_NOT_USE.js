/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ViewProps} from '../../../../Libraries/Components/View/ViewPropTypes';
import type {
  SafeAreaInsets,
  SafeAreaInsetsChangeEvent,
} from '../../../../Libraries/Types/CoreEventTypes';
import type {HostInstance} from '../../types/HostInstance';

import View from '../../../../Libraries/Components/View/View';
import I18nManager from '../../../../Libraries/ReactNative/I18nManager';
import Dimensions from '../../../../Libraries/Utilities/Dimensions';
import * as React from 'react';
import {useCallback, useMemo, useState} from 'react';

/**
 * Renders its children within the safe area of the device, by applying the part
 * of the view that is covered by the system UI as padding.
 *
 * This is the internal counterpart of `react-native-safe-area-context`, for the
 * few surfaces React Native renders itself (LogBox, the element inspector, ...)
 * which cannot take a dependency on it. Everything else should use the library.
 */
component SafeAreaView(
  ref?: React.RefSetter<HostInstance>,
  ...props: ViewProps
) {
  const {style, experimental_onSafeAreaInsetsChange, ...otherProps} = props;
  // Seeded with the window insets so the first frame is already padded; the
  // synchronous event then keeps them correct relative to this view. The seed
  // is only exact for views aligned with the window edges, which the internal
  // surfaces using this component (LogBox, the element inspector) are.
  const [insets, setInsets] = useState<?SafeAreaInsets>(
    () => Dimensions.get('window').experimental_safeAreaInsets,
  );

  const handleSafeAreaInsetsChange = useCallback(
    (event: SafeAreaInsetsChangeEvent) => {
      setInsets(event.nativeEvent.insets);
      experimental_onSafeAreaInsetsChange?.(event);
    },
    [experimental_onSafeAreaInsetsChange],
  );

  const paddingStyle = useMemo(() => {
    if (insets == null) {
      return null;
    }
    // Insets are physical edges, but Yoga remaps paddingLeft/paddingRight to
    // start/end when I18nManager's swapLeftAndRightInRTL is on, which would
    // pad the mirror-image edge in RTL. Swap the values so the physical edge
    // keeps its inset.
    const {isRTL, doLeftAndRightSwapInRTL} = I18nManager.getConstants();
    const swap = isRTL && doLeftAndRightSwapInRTL;
    return {
      paddingTop: insets.top,
      paddingRight: swap ? insets.left : insets.right,
      paddingBottom: insets.bottom,
      paddingLeft: swap ? insets.right : insets.left,
    };
  }, [insets]);

  return (
    <View
      {...otherProps}
      ref={ref}
      experimental_onSafeAreaInsetsChange={handleSafeAreaInsetsChange}
      style={[style, paddingStyle]}
    />
  );
}

export default SafeAreaView;
