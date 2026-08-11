/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <android/asset_manager.h>
#include <fbjni/Context.h>
#include <fbjni/fbjni.h>
#include <string>

namespace facebook::react {

AAssetManager* getJavaAssetManager();

bool isDirectoryNotEmpty(const std::string& path);

} // namespace facebook::react
