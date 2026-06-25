/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TouchedViewDataAtPoint} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';

import * as ReactNativeFeatureFlags from '../../../../../src/private/featureflags/ReactNativeFeatureFlags';
import {useCallback, useEffect, useState} from 'react';

type ExternalInspectionAPI = {
  enable: () => void,
  disable: () => void,
};

declare var __EXTERNAL_INSPECTION__: ?ExternalInspectionAPI;
declare var __EXTERNAL_INSPECTION_SELECT__: ?(payload: string) => void;

type UseExternalInspectionResult = {
  externalInspectingEnabled: boolean,
  reportToExternalInspection: (viewData: TouchedViewDataAtPoint) => void,
};

/**
 * Initializes the __EXTERNAL_INSPECTION__ API on the device.
 */
function ensureExternalInspectionAPI(
  onEnable: () => void,
  onDisable: () => void,
): ExternalInspectionAPI {
  if (
    typeof __EXTERNAL_INSPECTION__ === 'undefined' ||
    __EXTERNAL_INSPECTION__ == null
  ) {
    const api: ExternalInspectionAPI = {
      enable: onEnable,
      disable: onDisable,
    };
    // $FlowFixMe[prop-missing] Initializing global API for DevTools communication
    (global as $FlowFixMe).__EXTERNAL_INSPECTION__ = api;
    return api;
  }
  __EXTERNAL_INSPECTION__.enable = onEnable;
  __EXTERNAL_INSPECTION__.disable = onDisable;
  return __EXTERNAL_INSPECTION__;
}

export default function useExternalInspection(): UseExternalInspectionResult {
  const [externalInspectingEnabled, setExternalInspectingEnabled] =
    useState<boolean>(false);

  useEffect(() => {
    if (!ReactNativeFeatureFlags.externalElementInspectionEnabled()) {
      return;
    }

    const handleEnable = () => {
      setExternalInspectingEnabled(true);
    };

    const handleDisable = () => {
      setExternalInspectingEnabled(false);
    };

    ensureExternalInspectionAPI(handleEnable, handleDisable);
  }, []);

  const reportToExternalInspection = useCallback(
    (viewData: TouchedViewDataAtPoint) => {
      if (
        typeof __EXTERNAL_INSPECTION_SELECT__ === 'undefined' ||
        __EXTERNAL_INSPECTION_SELECT__ === null ||
        !externalInspectingEnabled
      ) {
        return;
      }

      __EXTERNAL_INSPECTION_SELECT__(
        JSON.stringify({
          frame: viewData.frame,
          hierarchy: viewData.hierarchy.map(item => ({
            name: item.name,
          })),
          touchedViewTag: viewData.touchedViewTag,
        }),
      );
    },
    [externalInspectingEnabled],
  );

  return {
    externalInspectingEnabled,
    reportToExternalInspection,
  };
}
