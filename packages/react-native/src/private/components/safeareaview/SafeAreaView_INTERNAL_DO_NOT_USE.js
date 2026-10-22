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
import * as React from 'react';
import {useCallback, useMemo, useState} from 'react';

/**
 * Renders its children within the safe area of the device, by applying the part
 * of the view that is covered by the system UI as padding.
 */
component SafeAreaView(
  ref?: React.RefSetter<HostInstance>,
  ...props: ViewProps
) {
  const {style, experimental_onSafeAreaInsetsChange, ...otherProps} = props;
  const [insets, setInsets] = useState<?SafeAreaInsets>(null);

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
    return {
      paddingTop: insets.top,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
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
