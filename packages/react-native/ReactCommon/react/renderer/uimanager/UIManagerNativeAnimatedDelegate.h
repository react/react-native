/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <jsi/jsi.h>

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/RawValue.h>

namespace facebook::react {

class UIManagerNativeAnimatedDelegate {
 public:
  virtual ~UIManagerNativeAnimatedDelegate() = default;

  virtual void runAnimationFrame() = 0;
};

} // namespace facebook::react
