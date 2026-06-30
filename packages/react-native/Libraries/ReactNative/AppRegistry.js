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
 * `AppRegistry` is the JS entry point to running all React Native apps.  App
 * root components should register themselves with
 * `AppRegistry.registerComponent`, then the native system can load the bundle
 * for the app and then actually run the app when it's ready by invoking
 * `AppRegistry.runApplication`.
 *
 * To "stop" an application when a view should be destroyed, call
 * `AppRegistry.unmountApplicationComponentAtRootTag` with the tag that was
 * pass into `runApplication`. These should always be used as a pair.
 *
 * `AppRegistry` should be `require`d early in the `require` sequence to make
 * sure the JS execution environment is setup before other modules are
 * `require`d.
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
