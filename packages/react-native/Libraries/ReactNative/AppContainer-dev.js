/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TouchedViewDataAtPoint} from '../Renderer/shims/ReactNativeTypes';
import type {
  ReactDevToolsAgent,
  ReactDevToolsGlobalHook,
} from '../Types/ReactDevToolsTypes';
import type {Props} from './AppContainer';

import useExternalInspection from '../../src/private/devsupport/devmenu/elementinspector/useExternalInspection';
import ReactNativeStyleAttributes from '../Components/View/ReactNativeStyleAttributes';
import View from '../Components/View/View';
import DebuggingOverlay from '../Debugging/DebuggingOverlay';
import useSubscribeToDebuggingOverlayRegistry from '../Debugging/useSubscribeToDebuggingOverlayRegistry';
import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import LogBoxNotificationContainer from '../LogBox/LogBoxNotificationContainer';
import StyleSheet from '../StyleSheet/StyleSheet';
import {RootTagContext, createRootTag} from './RootTag';
import * as React from 'react';
import {useRef} from 'react';

const {useEffect, useState, useCallback} = React;

const reactDevToolsHook: ReactDevToolsGlobalHook = (window as $FlowFixMe)
  .__REACT_DEVTOOLS_GLOBAL_HOOK__;

// Required for React DevTools to view / edit React Native styles in Flipper.
// Flipper doesn't inject these values when initializing DevTools.
if (reactDevToolsHook) {
  reactDevToolsHook.resolveRNStyle =
    require('../StyleSheet/flattenStyle').default;
  reactDevToolsHook.nativeStyleEditorValidAttributes = Object.keys(
    ReactNativeStyleAttributes,
  );
}

type ExternalInspection = {
  externalInspectingEnabled: boolean,
  readonly reportToExternalInspection: (
    viewData: TouchedViewDataAtPoint,
  ) => void,
};

type InspectorDeferredProps = {
  inspectedViewRef: InspectedViewRef,
  onInspectedViewRerenderRequest: () => void,
  reactDevToolsAgent?: ReactDevToolsAgent,
  devMenuInspectorOpen: boolean,
  externalInspection: ExternalInspection,
};

const InspectorDeferred = ({
  inspectedViewRef,
  onInspectedViewRerenderRequest,
  reactDevToolsAgent,
  devMenuInspectorOpen,
  externalInspection,
}: InspectorDeferredProps) => {
  // D39382967 adds a require cycle: InitializeCore -> AppContainer -> Inspector -> InspectorPanel -> ScrollView -> InitializeCore
  // We can't remove it yet, fallback to dynamic require for now. This is the only reason why this logic is in a separate function.
  const Inspector =
    require('../../src/private/devsupport/devmenu/elementinspector/Inspector').default;

  return (
    <Inspector
      inspectedViewRef={inspectedViewRef}
      onRequestRerenderApp={onInspectedViewRerenderRequest}
      reactDevToolsAgent={reactDevToolsAgent}
      devMenuInspectorOpen={devMenuInspectorOpen}
      externalInspection={externalInspection}
    />
  );
};

type ReactDevToolsOverlayDeferredProps = {
  inspectedViewRef: InspectedViewRef,
  reactDevToolsAgent: ReactDevToolsAgent,
};

const ReactDevToolsOverlayDeferred = ({
  inspectedViewRef,
  reactDevToolsAgent,
}: ReactDevToolsOverlayDeferredProps) => {
  const ReactDevToolsOverlay =
    require('../../src/private/devsupport/devmenu/elementinspector/ReactDevToolsOverlay').default;

  return (
    <ReactDevToolsOverlay
      inspectedViewRef={inspectedViewRef}
      reactDevToolsAgent={reactDevToolsAgent}
    />
  );
};

const AppContainer = ({
  children,
  initialProps,
  internal_excludeInspector = false,
  internal_excludeLogBox = false,
  rootTag,
  WrapperComponent,
  rootViewStyle,
}: Props): React.Node => {
  const appContainerRootViewRef: AppContainerRootViewRef = useRef(null);
  const innerViewRef: InspectedViewRef = useRef(null);
  const debuggingOverlayRef: DebuggingOverlayRef = useRef(null);

  useSubscribeToDebuggingOverlayRegistry(
    appContainerRootViewRef,
    debuggingOverlayRef,
  );

  const [key, setKey] = useState(0);
  const [shouldRenderInspector, setShouldRenderInspector] = useState(false);
  const [reactDevToolsAgent, setReactDevToolsAgent] =
    useState<ReactDevToolsAgent | void>(reactDevToolsHook?.reactDevtoolsAgent);
  const externalInspection = useExternalInspection();

  useEffect(() => {
    let inspectorSubscription = null;
    if (!internal_excludeInspector) {
      inspectorSubscription = RCTDeviceEventEmitter.addListener(
        'toggleElementInspector',
        () => setShouldRenderInspector(value => !value),
      );
    }

    let reactDevToolsAgentListener = null;
    // If this is first render, subscribe to the event from React DevTools hook
    if (reactDevToolsHook != null && reactDevToolsAgent == null) {
      reactDevToolsAgentListener = setReactDevToolsAgent;
      reactDevToolsHook.on?.('react-devtools', reactDevToolsAgentListener);
    }

    return () => {
      inspectorSubscription?.remove();

      if (
        reactDevToolsHook?.off != null &&
        reactDevToolsAgentListener != null
      ) {
        reactDevToolsHook.off('react-devtools', reactDevToolsAgentListener);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let innerView: React.Node = (
    <View
      collapsable={reactDevToolsAgent == null && !shouldRenderInspector}
      pointerEvents="box-none"
      key={key}
      style={rootViewStyle || styles.container}
      ref={innerViewRef}>
      {children}
    </View>
  );

  if (WrapperComponent != null) {
    innerView = (
      <WrapperComponent initialProps={initialProps}>
        {innerView}
      </WrapperComponent>
    );
  }

  const onInspectedViewRerenderRequest = useCallback(
    () => setKey(k => k + 1),
    [],
  );

  return (
    <RootTagContext.Provider value={createRootTag(rootTag)}>
      <View
        ref={appContainerRootViewRef}
        style={rootViewStyle || styles.container}
        pointerEvents="box-none">
        {innerView}

        <DebuggingOverlay ref={debuggingOverlayRef} />

        {reactDevToolsAgent != null && (
          <ReactDevToolsOverlayDeferred
            inspectedViewRef={innerViewRef}
            reactDevToolsAgent={reactDevToolsAgent}
          />
        )}

        {(shouldRenderInspector ||
          externalInspection.externalInspectingEnabled) && (
          <InspectorDeferred
            inspectedViewRef={innerViewRef}
            onInspectedViewRerenderRequest={onInspectedViewRerenderRequest}
            reactDevToolsAgent={reactDevToolsAgent}
            devMenuInspectorOpen={shouldRenderInspector}
            externalInspection={externalInspection}
          />
        )}

        {!internal_excludeLogBox && <LogBoxNotificationContainer />}
      </View>
    </RootTagContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
});

export type AppContainerRootViewRef = React.RefObject<React.ElementRef<
  typeof View,
> | null>;
export type InspectedViewRef = React.RefObject<React.ElementRef<
  typeof View,
> | null>;
export type DebuggingOverlayRef = React.RefObject<React.ElementRef<
  typeof DebuggingOverlay,
> | null>;

export default AppContainer;
