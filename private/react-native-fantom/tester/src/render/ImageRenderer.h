/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/mounting/stubs/StubViewTree.h>
#include <string>
#include <unordered_map>
#include <vector>
#include "Screenshot.h"

namespace facebook::react {

using AssetPathMap = std::unordered_map<std::string, std::string>;

// Renders a mounted revision without consulting React or the live shadow tree.
// The encoded bytes can also be retained by a mount transaction recorder.
class ImageRenderer {
 public:
  std::shared_ptr<Screenshot> capture(const StubViewTree &tree, const AssetPathMap &assetPaths = {}) const;
  std::vector<unsigned char> render(const StubViewTree &tree) const;
  void renderToFile(const StubViewTree &tree, const std::string &filePath) const;
};

} // namespace facebook::react
