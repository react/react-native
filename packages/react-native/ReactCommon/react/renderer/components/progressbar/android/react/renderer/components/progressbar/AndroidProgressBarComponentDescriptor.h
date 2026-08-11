/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include "AndroidProgressBarMeasurementsManager.h"
#include "AndroidProgressBarShadowNode.h"

namespace facebook::react {

/*
 * Descriptor for <AndroidProgressBar> component.
 */
class AndroidProgressBarComponentDescriptor final
    : public ConcreteComponentDescriptor<AndroidProgressBarShadowNode> {
 public:
  AndroidProgressBarComponentDescriptor(
      const ComponentDescriptorParameters& parameters)
      : ConcreteComponentDescriptor(parameters),
        measurementsManager_(
            std::make_shared<AndroidProgressBarMeasurementsManager>(
                contextContainer_)) {}

  void adopt(ShadowNode& shadowNode) const override {
    ConcreteComponentDescriptor::adopt(shadowNode);

    auto& androidProgressBarShadowNode =
        static_cast<AndroidProgressBarShadowNode&>(shadowNode);

    // `AndroidProgressBarShadowNode` uses
    // `AndroidProgressBarMeasurementsManager` to provide measurements to Yoga.
    androidProgressBarShadowNode.setAndroidProgressBarMeasurementsManager(
        measurementsManager_);
  }

 private:
  const std::shared_ptr<AndroidProgressBarMeasurementsManager>
      measurementsManager_;
};

} // namespace facebook::react
