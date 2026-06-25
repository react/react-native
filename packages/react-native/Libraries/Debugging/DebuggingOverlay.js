/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {
  ElementRectangle,
  TraceUpdate,
} from '../../src/private/specs_DEPRECATED/components/DebuggingOverlayNativeComponent';

import DebuggingOverlayNativeComponent, {
  Commands,
} from '../../src/private/specs_DEPRECATED/components/DebuggingOverlayNativeComponent';
import View from '../Components/View/View';
import UIManager from '../ReactNative/UIManager';
import StyleSheet from '../StyleSheet/StyleSheet';
import * as React from 'react';

const {useRef, useImperativeHandle} = React;
const isNativeComponentReady =
  UIManager.hasViewManagerConfig('DebuggingOverlay');

type DebuggingOverlayHandle = {
  highlightTraceUpdates(updates: ReadonlyArray<TraceUpdate>): void,
  highlightElements(elements: ReadonlyArray<ElementRectangle>): void,
  clearElementsHighlight(): void,
};

function DebuggingOverlay({
  ref,
}: {
  ref: React.RefSetter<DebuggingOverlayHandle>,
}): React.Node {
  useImperativeHandle(
    ref,
    () => ({
      clearElementsHighlight() {
        if (!isNativeComponentReady) {
          return;
        }

        if (nativeComponentRef.current != null) {
          Commands.clearElementsHighlights(nativeComponentRef.current);
        }
      },
      highlightElements(elements) {
        if (!isNativeComponentReady) {
          return;
        }

        if (nativeComponentRef.current != null) {
          Commands.highlightElements(nativeComponentRef.current, elements);
        }
      },
      highlightTraceUpdates(updates) {
        if (!isNativeComponentReady) {
          return;
        }

        const nonEmptyRectangles = updates.filter(
          ({rectangle, color}) => rectangle.width >= 0 && rectangle.height >= 0,
        );

        if (nativeComponentRef.current != null) {
          Commands.highlightTraceUpdates(
            nativeComponentRef.current,
            nonEmptyRectangles,
          );
        }
      },
    }),
    [],
  );

  const nativeComponentRef = useRef<React.ElementRef<
    typeof DebuggingOverlayNativeComponent,
  > | null>(null);

  return (
    isNativeComponentReady && (
      <View pointerEvents="none" style={styles.overlay}>
        <DebuggingOverlayNativeComponent
          ref={nativeComponentRef}
          style={styles.overlay}
        />
      </View>
    )
  );
}

const styles = StyleSheet.create({
  overlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});

export default DebuggingOverlay as component(
  ref?: React.RefSetter<DebuggingOverlayHandle>,
);
