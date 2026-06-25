/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/image/ImageEventEmitter.h>
#include <react/renderer/components/image/ImageProps.h>
#include <react/renderer/components/image/ImageState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/imagemanager/ImageManager.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

extern const char ImageComponentName[];

/*
 * `ShadowNode` for <Image> component.
 */
class ImageShadowNode final
    : public ConcreteViewShadowNode<ImageComponentName, ImageProps, ImageEventEmitter, ImageState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits()
  {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    return traits;
  }

  /*
   * Associates a shared `ImageManager` with the node.
   */
  void setImageManager(const std::shared_ptr<ImageManager> &imageManager);

  static ImageState initialStateData(
      const Props::Shared &props,
      const ShadowNodeFamily::Shared & /*family*/,
      const ComponentDescriptor &componentDescriptor)
  {
    auto imageSource = ImageSource{ImageSource::Type::Invalid};
    return {imageSource, {imageSource, nullptr}, {}};
  }

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

 private:
  ImageSource getImageSource() const;

  std::shared_ptr<ImageManager> imageManager_;

  void updateStateIfNeeded();
};

} // namespace facebook::react
