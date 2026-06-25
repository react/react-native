/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {InspectedViewRef} from '../../../../../Libraries/ReactNative/AppContainer-dev';
import type {PointerEvent} from '../../../../../Libraries/Types/CoreEventTypes';
import type {GestureResponderEvent} from '../../../../../Libraries/Types/CoreEventTypes';
import type {ReactDevToolsAgent} from '../../../../../Libraries/Types/ReactDevToolsTypes';
import type {InspectedElement} from './Inspector';

import View from '../../../../../Libraries/Components/View/View';
import StyleSheet from '../../../../../Libraries/StyleSheet/StyleSheet';
import * as ReactNativeFeatureFlags from '../../../../../src/private/featureflags/ReactNativeFeatureFlags';
import ElementBox from './ElementBox';
import * as React from 'react';

const getInspectorDataForViewAtPoint =
  require('./getInspectorDataForViewAtPoint').default;

const {useEffect, useState, useCallback} = React;

type Props = {
  inspectedViewRef: InspectedViewRef,
  reactDevToolsAgent: ReactDevToolsAgent,
};

export default function ReactDevToolsOverlay({
  inspectedViewRef,
  reactDevToolsAgent,
}: Props): React.Node {
  const [inspected, setInspected] = useState<?InspectedElement>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  useEffect(() => {
    function cleanup() {
      reactDevToolsAgent.removeListener('shutdown', cleanup);
      reactDevToolsAgent.removeListener(
        'startInspectingNative',
        onStartInspectingNative,
      );
      reactDevToolsAgent.removeListener(
        'stopInspectingNative',
        onStopInspectingNative,
      );
    }

    function onStartInspectingNative() {
      setIsInspecting(true);
      setInspected(null);
    }

    function onStopInspectingNative() {
      setIsInspecting(false);
      setInspected(null);
    }

    reactDevToolsAgent.addListener('shutdown', cleanup);
    reactDevToolsAgent.addListener(
      'startInspectingNative',
      onStartInspectingNative,
    );
    reactDevToolsAgent.addListener(
      'stopInspectingNative',
      onStopInspectingNative,
    );

    return cleanup;
  }, [reactDevToolsAgent]);

  const findViewForLocation = useCallback(
    (x: number, y: number) => {
      getInspectorDataForViewAtPoint(
        inspectedViewRef.current,
        x,
        y,
        viewData => {
          const {frame, closestPublicInstance} = viewData;

          if (closestPublicInstance == null) {
            return false;
          }

          reactDevToolsAgent.selectNode(closestPublicInstance);
          setInspected({frame});
          return true;
        },
      );
    },
    [inspectedViewRef, reactDevToolsAgent],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      findViewForLocation(e.nativeEvent.x, e.nativeEvent.y);
    },
    [findViewForLocation],
  );

  const onResponderMove = useCallback(
    (e: GestureResponderEvent) => {
      findViewForLocation(
        e.nativeEvent.touches[0].locationX,
        e.nativeEvent.touches[0].locationY,
      );
    },
    [findViewForLocation],
  );

  const shouldSetResponder = useCallback(
    (e: GestureResponderEvent): boolean => {
      onResponderMove(e);
      return true;
    },
    [onResponderMove],
  );

  const highlight = inspected ? <ElementBox frame={inspected.frame} /> : null;

  if (isInspecting) {
    const events =
      // Pointer events only work on fabric
      ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover()
        ? {
            onPointerMove,
            onPointerDown: onPointerMove,
          }
        : {
            onStartShouldSetResponder: shouldSetResponder,
            onResponderMove: onResponderMove,
          };

    return (
      <View
        nativeID="devToolsInspectorOverlay"
        style={styles.inspector}
        {...events}>
        {highlight}
      </View>
    );
  }

  return highlight;
}

const styles = StyleSheet.create({
  inspector: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
  },
});
