/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*::
export type Folder = RegExp;

export type Files = Readonly<{
  headers: ReadonlyArray<string>,
  sources: ReadonlyArray<string>,
  resources?: ReadonlyArray<string>,
  // Relative path from target root to where the header files should be copied.
  // Can be used to ensure header search paths like <double-conversion/double-conversion.h>
  // are correctly resolved.
  headerTargetFolder?: string,
  headerSkipFolderNames?: string,
}>;

export type Define = Readonly<{
  name: string,
  value?: string,
}>;

export type Settings = Readonly<{
  headerSearchPaths?: ReadonlyArray<string>,
  defines?: ReadonlyArray<Define>,
  cCompilerFlags?: ReadonlyArray<string>,
  cxxCompilerFlags?: ReadonlyArray<string>,
  linkedLibraries?: ReadonlyArray<string>,
  publicHeaderFiles: string,
  linkerSettings?: ReadonlyArray<string>
}>;

export type Dependency = Readonly<{
  name: string,
  version: string,
  url: URL,
  prepareScript?: string,
  files: Files,
  settings: Settings,
  disabled?: boolean,
  dependencies?: ReadonlyArray<string>,
}>;

export type Platform =
  'ios' |
  'ios-simulator' |
  'macos' |
  'mac-catalyst' |
  'tvos' |
  'tvos-simulator' |
  'xros' |
  'xros-simulator';

export type Destination =
  'iOS' |
  'iOS Simulator' |
  'macOS' |
  'macOS,variant=Mac Catalyst' |
  'tvOS' |
  'tvOS Simulator' |
  'visionOS' |
  'visionOS Simulator';
*/

module.exports = {};
