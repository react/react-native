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

/**
 * Global scene tracker for managing the currently active scene in the application.
 * Notifies listeners whenever the active scene changes.
 */
const SceneTracker = {
  /**
   * Sets the currently active scene and notifies all registered listeners.
   * @param {Scene} scene - The new active scene object
   */
  setActiveScene(scene: Scene) {
    _activeScene = scene;
    _listeners.forEach(listener => listener(_activeScene));
  },

  /**
   * Gets the currently active scene.
   * @returns {Scene} The active scene object
   */
  getActiveScene(): Scene {
    return _activeScene;
  },

  /**
   * Registers a listener to be called whenever the active scene changes.
   * @param {Function} callback - Function called with the new scene when it changes
   * @returns {Object} Object with a remove() method to unsubscribe
   */
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
