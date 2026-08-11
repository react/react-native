/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <react/renderer/componentregistry/ComponentDescriptorFactory.h>
#include <react/renderer/core/RawValue.h>

namespace facebook::react {

class UIManagerAnimationDelegate {
 public:
  virtual ~UIManagerAnimationDelegate() = default;

  /*
   * Configure a LayoutAnimation.
   * TODO: need SurfaceId here
   */
  virtual void uiManagerDidConfigureNextLayoutAnimation(
      jsi::Runtime& runtime,
      const RawValue& config,
      const jsi::Value& successCallback,
      const jsi::Value& failureCallback) const = 0;

  /**
   * Set ComponentDescriptor registry.
   *
   * @param componentDescriptorRegistry the registry of componentDescriptors
   */
  virtual void setComponentDescriptorRegistry(
      const SharedComponentDescriptorRegistry& componentDescriptorRegistry) = 0;

  /**
   * Only needed on Android to drive animations.
   */
  virtual bool shouldAnimateFrame() const = 0;

  /**
   * Drop any animations for a given surface.
   */
  virtual void stopSurface(SurfaceId surfaceId) = 0;
};

} // namespace facebook::react
