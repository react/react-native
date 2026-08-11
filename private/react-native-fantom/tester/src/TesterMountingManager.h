/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "FantomImageLoader.h"

#include <react/renderer/mounting/stubs/StubViewTree.h>
#include <react/renderer/uimanager/IMountingManager.h>
#include <string>
#include <unordered_map>

#include "render/RenderOutput.h"

namespace facebook::react {
class IImageLoader;

class TesterMountingManager : public IMountingManager {
 public:
  TesterMountingManager(std::function<void(SurfaceId)>&& onAfterMount);

  void executeMount(
      SurfaceId surfaceId,
      MountingTransaction&& mountingTransaction) override;

  void dispatchCommand(
      const ShadowView& shadowView,
      const std::string& commandName,
      const folly::dynamic& args) override;

  void synchronouslyUpdateViewOnUIThread(
      Tag reactTag,
      const folly::dynamic& changedProps) override;

  void onUpdateShadowTree(
      const std::unordered_map<Tag, folly::dynamic>& tagToProps) override;

  ComponentRegistryFactory getComponentRegistryFactory() override;

  std::vector<std::string> takeMountingLogs(SurfaceId surfaceId);

  folly::dynamic getViewDirectManipulationProps(Tag tag) const;

  folly::dynamic getViewFabricUpdateProps(Tag tag) const;

  StubViewTree getViewTree(SurfaceId surfaceId);
  void initViewTree(SurfaceId surfaceId, const StubViewTree& viewTree) {
    viewTrees_[surfaceId] = viewTree;
  }

  std::shared_ptr<FantomImageLoader> imageLoader_;

  std::shared_ptr<IImageLoader> getImageLoader() noexcept override {
    return imageLoader_;
  }

  std::unique_ptr<RenderOutput>& renderer() {
    return renderer_;
  }

 private:
  std::function<void(SurfaceId)> onAfterMount_;
  std::unordered_map<SurfaceId, StubViewTree> viewTrees_;
  std::unordered_map<Tag, folly::dynamic> viewDirectManipulationProps_;
  std::unordered_map<Tag, folly::dynamic> viewFabricUpdateProps_;

  std::unique_ptr<RenderOutput> renderer_;
};

}; // namespace facebook::react
