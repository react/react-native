/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/image/ImageShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

class ImageManager;

extern const char ImageManagerKey[];

/*
 * Descriptor for <Image> component.
 */
class ImageComponentDescriptor final
    : public ConcreteComponentDescriptor<ImageShadowNode> {
 public:
  explicit ImageComponentDescriptor(
      const ComponentDescriptorParameters& parameters);

  void adopt(ShadowNode& shadowNode) const override;

 private:
  const std::shared_ptr<ImageManager> imageManager_;
};

} // namespace facebook::react
