/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * Interface for NativeModules which allows to augment NativeModules with type information.
 * See react-native-sensor-manager for example.
 */
interface NativeModulesStatic {
  [name: string]: any;
}

/**
 * Native Modules written in ObjectiveC/Swift/Java exposed via the RCTBridge
 * Define lazy getters for each module. These will return the module if already loaded, or load it if not.
 * See https://reactnative.dev/docs/native-modules-ios
 * @example
 * const MyModule = NativeModules.ModuleName
 */
export const NativeModules: NativeModulesStatic;
