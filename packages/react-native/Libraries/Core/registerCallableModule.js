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

type Module = {...};
type RegisterCallableModule = (
  name: string,
  moduleOrFactory: Module | ((v: void) => Module),
) => void;

const registerCallableModule: RegisterCallableModule = (function () {
  if (global.RN$Bridgeless === true) {
    return (name, moduleOrFactory) => {
      if (typeof moduleOrFactory === 'function') {
        global.RN$registerCallableModule(name, moduleOrFactory);
        return;
      }

      global.RN$registerCallableModule(name, () => moduleOrFactory);
    };
  }

  const BatchedBridge = require('../BatchedBridge/BatchedBridge').default;
  return (name, moduleOrFactory) => {
    if (typeof moduleOrFactory === 'function') {
      BatchedBridge.registerLazyCallableModule(name, moduleOrFactory);
      return;
    }

    BatchedBridge.registerCallableModule(name, moduleOrFactory);
  };
})();

export default registerCallableModule;
