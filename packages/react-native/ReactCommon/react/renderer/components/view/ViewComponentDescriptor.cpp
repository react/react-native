/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewComponentDescriptor.h"
#include <react/renderer/imagemanager/ImageManager.h>

namespace facebook::react {

extern const char ImageManagerKey[];

ViewComponentDescriptor::ViewComponentDescriptor(
    const ComponentDescriptorParameters& parameters)
    : ConcreteComponentDescriptor(parameters),
      imageManager_(
          getManagerByName<ImageManager>(contextContainer_, ImageManagerKey)) {}

void ViewComponentDescriptor::adopt(ShadowNode& shadowNode) const {
  ConcreteComponentDescriptor::adopt(shadowNode);

  auto& viewShadowNode = static_cast<ViewShadowNode&>(shadowNode);
  viewShadowNode.setImageManager(imageManager_);
}

} // namespace facebook::react
