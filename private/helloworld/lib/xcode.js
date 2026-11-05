/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// For the complete list:
//
// xcodebuild \
//  -workspace HelloWorld.xcworkspace \
//  -scheme HelloWorld \
//  -configuration Debug \
//  -sdk iphonesimulator \
//  -showBuildSettings
//  -json

export type XcodeBuildSettings = {
  action: string,
  buildSettings: {
    CONFIGURATION_BUILD_DIR: string,
    EXECUTABLE_FOLDER_PATH: string,
    PRODUCT_BUNDLE_IDENTIFIER: string,
    TARGET_BUILD_DIR: string,
    UNLOCALIZED_RESOURCES_FOLDER_PATH: string,
    ...
  },
  target: string,
};
