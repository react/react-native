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

/**
 * `AppRegistry` is the JS entry point to running all React Native apps. Root
 * components register themselves with `AppRegistry.registerComponent`, then
 * the native system can load the bundle for the app and run it when ready by
 * invoking `AppRegistry.runApplication`.
 *
 * To stop an application when a view should be destroyed, call
 * `AppRegistry.unmountApplicationComponentAtRootTag` with the tag that was
 * passed into `runApplication`. These should always be used as a pair.
 *
 * `AppRegistry` should be required early in the require sequence to make sure
 * the JS execution environment is set up before other modules are required.
 *
 * @see https://reactnative.dev/docs/appregistry
 */
export {AppRegistry};
