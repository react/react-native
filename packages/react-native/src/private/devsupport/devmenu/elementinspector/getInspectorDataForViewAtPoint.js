/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TouchedViewDataAtPoint} from '../../../../../Libraries/Renderer/shims/ReactNativeTypes';
import type {HostInstance} from '../../../types/HostInstance';

const invariant = require('invariant');

export type ReactRenderer = {
  rendererConfig: {
    getInspectorDataForViewAtPoint: (
      inspectedView: ?HostInstance,
      locationX: number,
      locationY: number,
      callback: Function,
    ) => void,
    ...
  },
};
type AttachedRendererEventPayload = {id: number, renderer: ReactRenderer};

const reactDevToolsHook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
invariant(
  Boolean(reactDevToolsHook),
  'getInspectorDataForViewAtPoint should not be used if React DevTools hook is not injected',
);

const renderers: Array<ReactRenderer> = Array.from(
  (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.renderers.values(),
);

const appendRenderer = ({renderer}: AttachedRendererEventPayload) =>
  renderers.push(renderer);
reactDevToolsHook.on('renderer', appendRenderer);

function validateRenderers(): void {
  invariant(
    renderers.length > 0,
    'Expected to find at least one React Native renderer on DevTools hook.',
  );
}

function getInspectorDataForViewAtPoint(
  inspectedView: ?HostInstance,
  locationX: number,
  locationY: number,
  callback: (viewData: TouchedViewDataAtPoint) => boolean,
) {
  validateRenderers();

  let shouldBreak = false;
  // Check all renderers for inspector data.
  for (const renderer of renderers) {
    if (shouldBreak) {
      break;
    }

    if (renderer?.rendererConfig?.getInspectorDataForViewAtPoint != null) {
      renderer.rendererConfig.getInspectorDataForViewAtPoint(
        inspectedView,
        locationX,
        locationY,
        viewData => {
          // Only return with non-empty view data since only one renderer will have this view.
          if (viewData && viewData.hierarchy.length > 0) {
            shouldBreak = callback(viewData);
          }
        },
      );
    }
  }
}

export default getInspectorDataForViewAtPoint;
