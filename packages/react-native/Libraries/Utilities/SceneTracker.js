/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

export type Scene = {name: string, [string]: unknown, ...};

let _listeners: Array<(scene: Scene) => void> = [];

let _activeScene: Scene = {name: 'default'};

const SceneTracker = {
  setActiveScene(scene: Scene) {
    _activeScene = scene;
    _listeners.forEach(listener => listener(_activeScene));
  },

  getActiveScene(): Scene {
    return _activeScene;
  },

  addActiveSceneChangedListener(callback: (scene: Scene) => void): {
    remove: () => void,
    ...
  } {
    _listeners.push(callback);
    return {
      remove: () => {
        _listeners = _listeners.filter(listener => callback !== listener);
      },
    };
  },
};

export default SceneTracker;
