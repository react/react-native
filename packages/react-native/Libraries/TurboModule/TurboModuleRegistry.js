/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from './RCTExport';

import invariant from 'invariant';

const NativeModules = require('../BatchedBridge/NativeModules').default;

const turboModuleProxy = global.__turboModuleProxy;

function requireModule<T extends TurboModule>(name: string): ?T {
  if (turboModuleProxy != null) {
    const module: ?T = turboModuleProxy(name);
    if (module != null) {
      return module;
    }
  }

  const legacyModule: ?T = NativeModules[name];
  if (legacyModule != null) {
    return legacyModule;
  }

  return null;
}

export function get<T extends TurboModule>(name: string): ?T {
  return requireModule<T>(name);
}

export function getEnforcing<T extends TurboModule>(name: string): T {
  const module = requireModule<T>(name);
  invariant(
    module != null,
    `TurboModuleRegistry.getEnforcing(...): '${name}' could not be found. ` +
      'Verify that a module by this name is registered in the native binary.',
  );
  return module;
}
