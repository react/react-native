/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {InspectedViewRef} from '../../../../../Libraries/ReactNative/AppContainer-dev';
import type {
  InspectorData,
  TouchedViewDataAtPoint,
} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {ViewStyleProp} from '../../../../../Libraries/StyleSheet/StyleSheet';
import type {ReactDevToolsAgent} from '../../../../../Libraries/Types/ReactDevToolsTypes';

import SafeAreaView from '../../../components/safeareaview/SafeAreaView_INTERNAL_DO_NOT_USE';
import * as React from 'react';

const View = require('../../../../../Libraries/Components/View/View').default;
const PressabilityDebug = require('../../../../../Libraries/Pressability/PressabilityDebug');
const {
  findNodeHandle,
} = require('../../../../../Libraries/ReactNative/RendererProxy');
const StyleSheet =
  require('../../../../../Libraries/StyleSheet/StyleSheet').default;
const Dimensions =
  require('../../../../../Libraries/Utilities/Dimensions').default;
const Platform = require('../../../../../Libraries/Utilities/Platform').default;
const getInspectorDataForViewAtPoint =
  require('./getInspectorDataForViewAtPoint').default;
const InspectorOverlay = require('./InspectorOverlay').default;
const InspectorPanel = require('./InspectorPanel').default;

const {useState} = React;

type PanelPosition = 'top' | 'bottom';

export type InspectedElementFrame = TouchedViewDataAtPoint['frame'];
export type InspectedElement = Readonly<{
  frame: InspectedElementFrame,
  style?: ViewStyleProp,
}>;
export type ElementsHierarchy = InspectorData['hierarchy'];

type ExternalInspection = {
  externalInspectingEnabled: boolean,
  readonly reportToExternalInspection: (
    viewData: TouchedViewDataAtPoint,
  ) => void,
};

type Props = {
  inspectedViewRef: InspectedViewRef,
  onRequestRerenderApp: () => void,
  reactDevToolsAgent?: ReactDevToolsAgent,
  devMenuInspectorOpen: boolean,
  externalInspection: ExternalInspection,
};

function Inspector({
  inspectedViewRef,
  onRequestRerenderApp,
  reactDevToolsAgent,
  devMenuInspectorOpen,
  externalInspection,
}: Props): React.Node {
  const [inspectingEnabled, setInspectingEnabled] = useState<boolean>(true);
  const {externalInspectingEnabled, reportToExternalInspection} =
    externalInspection;

  const [panelPosition, setPanelPosition] = useState<PanelPosition>('bottom');
  const [inspectedElement, setInspectedElement] =
    useState<?InspectedElement>(null);
  const [selectionIndex, setSelectionIndex] = useState<?number>(null);
  const [elementsHierarchy, setElementsHierarchy] =
    useState<?ElementsHierarchy>(null);

  // Derive inspecting state: external inspection forces it on, otherwise use local state
  const isInspecting = externalInspectingEnabled || inspectingEnabled;

  const setSelection = (i: number) => {
    const hierarchyItem = elementsHierarchy?.[i];
    if (hierarchyItem == null) {
      return;
    }

    // We pass in findNodeHandle as the method is injected
    const {measure, props} = hierarchyItem.getInspectorData(findNodeHandle);

    measure((x, y, width, height, left, top) => {
      // $FlowFixMe[incompatible-type] `props` from InspectorData are defined as <string, string> dictionary, which is incompatible with ViewStyleProp
      setInspectedElement({
        frame: {left, top, width, height},
        style: props.style,
      });

      setSelectionIndex(i);
    });
  };

  const onTouchPoint = (locationX: number, locationY: number) => {
    const setTouchedViewData = (viewData: TouchedViewDataAtPoint) => {
      const {
        hierarchy,
        props,
        selectedIndex,
        frame,
        pointerY,
        touchedViewTag,
        closestInstance,
      } = viewData;

      // Report to external inspection if in external inspection mode
      if (externalInspectingEnabled) {
        reportToExternalInspection(viewData);
      }

      // Sync the touched view with React DevTools.
      // Note: This is Paper only. To support Fabric,
      // DevTools needs to be updated to not rely on view tags.
      if (reactDevToolsAgent) {
        reactDevToolsAgent.selectNode(findNodeHandle(touchedViewTag));
        if (closestInstance != null) {
          reactDevToolsAgent.selectNode(closestInstance);
        }
      }

      setPanelPosition(
        pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
      );
      setSelectionIndex(selectedIndex);
      setElementsHierarchy(hierarchy);
      // $FlowFixMe[incompatible-type] `props` from InspectorData are defined as <string, string> dictionary, which is incompatible with ViewStyleProp
      setInspectedElement({
        frame,
        style: props.style,
      });
    };

    getInspectorDataForViewAtPoint(
      inspectedViewRef.current,
      locationX,
      locationY,
      viewData => {
        setTouchedViewData(viewData);
        return false;
      },
    );
  };

  const handleSetInspecting = (enabled: boolean) => {
    setInspectingEnabled(enabled);
    setInspectedElement(null);
  };

  const setTouchTargeting = (val: boolean) => {
    PressabilityDebug.setEnabled(val);
    onRequestRerenderApp();
  };

  const panelContainerStyle =
    panelPosition === 'bottom'
      ? {bottom: 0}
      : Platform.select({ios: {top: 0}, default: {top: 0}});

  return (
    <View style={styles.container} pointerEvents="box-none">
      {isInspecting && (
        <InspectorOverlay
          inspected={inspectedElement}
          onTouchPoint={onTouchPoint}
          externalInspectionActive={externalInspectingEnabled}
        />
      )}

      {!externalInspectingEnabled && (
        <SafeAreaView style={[styles.panelContainer, panelContainerStyle]}>
          <InspectorPanel
            devtoolsIsOpen={!!reactDevToolsAgent}
            inspecting={inspectingEnabled}
            setInspecting={handleSetInspecting}
            inspected={inspectedElement}
            hierarchy={elementsHierarchy}
            selection={selectionIndex}
            setSelection={setSelection}
            touchTargeting={PressabilityDebug.isEnabled()}
            setTouchTargeting={setTouchTargeting}
          />
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

export default Inspector;
