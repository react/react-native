/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import * as React from 'react';
import {View} from 'react-native';

// A ref to a host component resolves to its imperative handle, which exposes
// the native measurement and mutation methods. `React.ComponentRef<typeof View>`
// is the pattern that resolves to that handle under both the legacy and the
// strict public types; the `View` component type itself is not the handle.
type ViewHandle = React.ComponentRef<typeof View>;

export function ViewImperativeHandle() {
  const viewRef = React.useRef<ViewHandle>(null);
  const targetRef = React.useRef<ViewHandle>(null);

  const measure = () => {
    const view = viewRef.current;
    const target = targetRef.current;
    if (view == null || target == null) {
      return;
    }

    view.measure(
      (
        x: number,
        y: number,
        width: number,
        height: number,
        pageX: number,
        pageY: number,
      ) => {},
    );

    view.measureInWindow(
      (x: number, y: number, width: number, height: number) => {},
    );

    view.measureLayout(
      target,
      (left: number, top: number, width: number, height: number) => {},
      () => {},
    );

    view.setNativeProps({});
  };

  return (
    <View ref={viewRef}>
      <View ref={targetRef} />
    </View>
  );
}
