/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidSwitchMeasurementsManager.h"
#include "AndroidSwitchShadowNode.h"

#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <AndroidSwitch> component.
 */
class AndroidSwitchComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidSwitchShadowNode> {
 public:
  AndroidSwitchComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(std::make_shared<AndroidSwitchMeasurementsManager>(
            contextContainer_)) {}

  void adopt(ShadowNode& shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto& androidSwitchShadowNode =
        static_cast<AndroidSwitchShadowNode&>(shadowNode);

    // `AndroidSwitchShadowNode` uses `AndroidSwitchMeasurementsManager` to
    // provide measurements to Yoga.
    androidSwitchShadowNode.setAndroidSwitchMeasurementsManager(
        measurementsManager_);
  }

 private:
  const std::shared_ptr<AndroidSwitchMeasurementsManager> measurementsManager_;
};

} // namespace facebook::react
