/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import registerCallableModule from '../Core/registerCallableModule';
/**
 * `AppRegistry` is the JavaScript entry point to running all React Native apps.
 *
 * See https://reactnative.dev/docs/appregistry
 */
import * as AppRegistry from './AppRegistryImpl';

// Register LogBox as a default surface
AppRegistry.registerComponent('LogBox', () => {
  if (__DEV__ && typeof jest === 'undefined') {
    return require('../LogBox/LogBoxInspectorContainer').default;
  } else {
    return function NoOp() {
      return null;
    };
  }
});

global.RN$AppRegistry = AppRegistry;

registerCallableModule('AppRegistry', AppRegistry);

export {AppRegistry};
