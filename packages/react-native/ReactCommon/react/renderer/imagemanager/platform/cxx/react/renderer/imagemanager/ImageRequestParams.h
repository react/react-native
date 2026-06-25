/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Float.h>

namespace facebook::react {

class ImageRequestParams {
 public:
  ImageRequestParams() = default;
  explicit ImageRequestParams(Float blurRadius) : blurRadius(blurRadius) {}

  Float blurRadius{};

  bool operator==(const ImageRequestParams &rhs) const = default;
};

} // namespace facebook::react
