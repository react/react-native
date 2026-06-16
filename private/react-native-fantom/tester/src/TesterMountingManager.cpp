/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TesterMountingManager.h"
#include "stubs/StubComponentRegistryFactory.h"

#include <glog/logging.h>
#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/DynamicPropsUtilities.h>
#include <react/renderer/scheduler/Scheduler.h>

namespace facebook::react {

using namespace std::string_literals;

TesterMountingManager::TesterMountingManager(
    std::function<void(SurfaceId)>&& onAfterMount)
    : onAfterMount_(onAfterMount), renderer_(std::make_unique<RenderOutput>()) {
  imageLoader_ = std::make_shared<FantomImageLoader>();
}

void TesterMountingManager::executeMount(
    SurfaceId surfaceId,
    MountingTransaction&& mountingTransaction) {
  const auto& mutations = mountingTransaction.getMutations();
  LOG(INFO) << "executeMount: surfaceId = " << surfaceId;

  if (auto it = viewTrees_.find(surfaceId); it != viewTrees_.end()) {
    it->second.mutate(mutations);
    renderer_->markMutated(surfaceId);
  } else {
    LOG(ERROR) << "Can't aplly mutations, missing view tree surfaceId = "
               << surfaceId;
  }

  if (onAfterMount_ != nullptr) {
    onAfterMount_(surfaceId);
  }
}

void TesterMountingManager::dispatchCommand(
    const ShadowView& shadowView,
    const std::string& commandName,
    const folly::dynamic& args) {
  if (viewTrees_.find(shadowView.surfaceId) != viewTrees_.end()) {
    viewTrees_[shadowView.surfaceId].dispatchCommand(
        shadowView, commandName, args);
  } else {
    LOG(ERROR)
        << "dispatchCommand called for a surface that is not running, surfaceId = "
        << shadowView.surfaceId;
  }
}

void TesterMountingManager::synchronouslyUpdateViewOnUIThread(
    Tag reactTag,
    const folly::dynamic& changedProps) {
  if (viewDirectManipulationProps_.contains(reactTag)) {
    auto& currentProps = viewDirectManipulationProps_[reactTag];
    currentProps = mergeDynamicProps(
        currentProps, changedProps, NullValueStrategy::Override);
  } else {
    viewDirectManipulationProps_[reactTag] = changedProps;
  }
}

void TesterMountingManager::onUpdateShadowTree(
    const std::unordered_map<Tag, folly::dynamic>& tagToProps) {
  for (const auto& [tag, props] : tagToProps) {
    if (viewFabricUpdateProps_.contains(tag)) {
      auto& currentProps = viewFabricUpdateProps_[tag];
      currentProps =
          mergeDynamicProps(currentProps, props, NullValueStrategy::Override);
    } else {
      viewFabricUpdateProps_[tag] = props;
    }
  }
}

std::vector<std::string> TesterMountingManager::takeMountingLogs(
    SurfaceId surfaceId) {
  if (viewTrees_.find(surfaceId) != viewTrees_.end()) {
    return viewTrees_[surfaceId].takeMountingLogs();
  } else {
    LOG(ERROR)
        << "takeMountingLogs called for a surface that is not running, surfaceId = "
        << surfaceId;
    return {};
  }
}

// getViewDirectManipulationProps
folly::dynamic TesterMountingManager::getViewDirectManipulationProps(
    Tag reactTag) const {
  if (viewDirectManipulationProps_.contains(reactTag)) {
    return viewDirectManipulationProps_.at(reactTag);
  } else {
    LOG(ERROR)
        << "getViewDirectManipulationProps called for a view does not exist";
    return nullptr;
  }
}

folly::dynamic TesterMountingManager::getViewFabricUpdateProps(
    Tag reactTag) const {
  if (viewFabricUpdateProps_.contains(reactTag)) {
    return viewFabricUpdateProps_.at(reactTag);
  } else {
    LOG(ERROR) << "getViewFabricUpdateProps called for a view does not exist";
    return nullptr;
  }
}

ComponentRegistryFactory TesterMountingManager::getComponentRegistryFactory() {
  return getDefaultComponentRegistryFactory();
}

StubViewTree TesterMountingManager::getViewTree(SurfaceId surfaceId) {
  if (viewTrees_.find(surfaceId) == viewTrees_.end()) {
    LOG(ERROR)
        << "getViewTree called for a surface that is not running, surfaceId = "
        << surfaceId;
    return {};
  }

  return viewTrees_[surfaceId];
}

} // namespace facebook::react
