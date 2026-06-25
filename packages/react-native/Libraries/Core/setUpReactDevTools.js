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

import type {Domain} from '../../src/private/devsupport/rndevtools/setUpFuseboxReactDevToolsDispatcher';
import type {Spec as NativeReactDevToolsRuntimeSettingsModuleSpec} from '../../src/private/devsupport/rndevtools/specs/NativeReactDevToolsRuntimeSettingsModule';

if (__DEV__) {
  if (typeof global.queueMicrotask !== 'function') {
    console.error(
      'queueMicrotask should exist before setting up React DevTools.',
    );
  }

  // Keep in sync with ExceptionsManager/installConsoleErrorReporter
  // $FlowExpectedError[prop-missing]
  if (console._errorOriginal != null) {
    console.error(
      'ExceptionsManager should be set up after React DevTools to avoid console.error arguments mutation',
    );
  }
}

if (__DEV__) {
  // Register dispatcher on global, which can be used later by Chrome DevTools frontend
  require('../../src/private/devsupport/rndevtools/setUpFuseboxReactDevToolsDispatcher');
  const {
    initialize,
    connectWithCustomMessagingProtocol,
  } = require('react-devtools-core');

  const reactDevToolsSettingsManager = require('../../src/private/devsupport/rndevtools/ReactDevToolsSettingsManager');
  const serializedHookSettings =
    reactDevToolsSettingsManager.getGlobalHookSettings();
  const maybeReactDevToolsRuntimeSettingsModuleModule =
    require('../../src/private/devsupport/rndevtools/specs/NativeReactDevToolsRuntimeSettingsModule').default;

  let hookSettings = null;
  if (serializedHookSettings != null) {
    try {
      const parsedSettings = JSON.parse(serializedHookSettings);
      hookSettings = parsedSettings;
    } catch {
      console.error(
        'Failed to parse persisted React DevTools hook settings. React DevTools will be initialized with default settings.',
      );
    }
  }

  const {
    isProfiling: shouldStartProfilingNow,
    profilingSettings: initialProfilingSettings,
  } = readReloadAndProfileConfig(maybeReactDevToolsRuntimeSettingsModuleModule);

  // Install hook before React is loaded.
  initialize(hookSettings, shouldStartProfilingNow, initialProfilingSettings);

  // This should be defined in DEV, otherwise error is expected.
  const fuseboxReactDevToolsDispatcher =
    global.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__;
  const reactDevToolsFuseboxGlobalBindingName =
    fuseboxReactDevToolsDispatcher.BINDING_NAME;

  const ReactNativeStyleAttributes =
    require('../Components/View/ReactNativeStyleAttributes').default;
  const resolveRNStyle = require('../StyleSheet/flattenStyle').default;

  function handleReactDevToolsSettingsUpdate(settings: Object) {
    reactDevToolsSettingsManager.setGlobalHookSettings(
      JSON.stringify(settings),
    );
  }

  let disconnect = null;
  function disconnectBackendFromReactDevToolsInFuseboxIfNeeded() {
    if (disconnect != null) {
      disconnect();
      disconnect = null;
    }
  }

  function connectToReactDevToolsInFusebox(domain: Domain) {
    const {
      isReloadAndProfileSupported,
      isProfiling,
      onReloadAndProfile,
      onReloadAndProfileFlagsReset,
    } = readReloadAndProfileConfig(
      maybeReactDevToolsRuntimeSettingsModuleModule,
    );
    disconnect = connectWithCustomMessagingProtocol({
      onSubscribe: listener => {
        domain.onMessage.addEventListener(listener);
      },
      onUnsubscribe: listener => {
        domain.onMessage.removeEventListener(listener);
      },
      onMessage: (event, payload) => {
        domain.sendMessage({event, payload});
      },
      nativeStyleEditorValidAttributes: Object.keys(ReactNativeStyleAttributes),
      resolveRNStyle,
      onSettingsUpdated: handleReactDevToolsSettingsUpdate,
      isReloadAndProfileSupported,
      isProfiling,
      onReloadAndProfile,
      onReloadAndProfileFlagsReset,
    });
  }

  // 1. If React DevTools has already been opened and initialized in Fusebox, bindings survive reloads
  if (global[reactDevToolsFuseboxGlobalBindingName] != null) {
    disconnectBackendFromReactDevToolsInFuseboxIfNeeded();
    const domain =
      fuseboxReactDevToolsDispatcher.initializeDomain('react-devtools');
    connectToReactDevToolsInFusebox(domain);
  }

  // 2. If React DevTools panel in Fusebox was opened for the first time after the runtime has been created
  // 2. OR if React DevTools frontend was re-initialized: Chrome DevTools was closed and then re-opened
  global.__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__.onDomainInitialization.addEventListener(
    (domain: Domain) => {
      if (domain.name === 'react-devtools') {
        disconnectBackendFromReactDevToolsInFuseboxIfNeeded();
        connectToReactDevToolsInFusebox(domain);
      }
    },
  );
}

function readReloadAndProfileConfig(
  maybeModule: ?NativeReactDevToolsRuntimeSettingsModuleSpec,
) {
  const isReloadAndProfileSupported = maybeModule != null;
  const config = maybeModule?.getReloadAndProfileConfig();
  const isProfiling = config?.shouldReloadAndProfile === true;
  const profilingSettings = {
    recordChangeDescriptions: config?.recordChangeDescriptions === true,
    recordTimeline: false,
  };
  const onReloadAndProfile = (recordChangeDescriptions: boolean) => {
    if (maybeModule == null) {
      return;
    }

    maybeModule.setReloadAndProfileConfig({
      shouldReloadAndProfile: true,
      recordChangeDescriptions,
    });
  };
  const onReloadAndProfileFlagsReset = () => {
    if (maybeModule == null) {
      return;
    }

    maybeModule.setReloadAndProfileConfig({
      shouldReloadAndProfile: false,
      recordChangeDescriptions: false,
    });
  };

  return {
    isReloadAndProfileSupported,
    isProfiling,
    profilingSettings,
    onReloadAndProfile,
    onReloadAndProfileFlagsReset,
  };
}
