/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SurfaceHandler.h"

#include <cxxreact/TraceSection.h>
#include <react/debug/react_native_assert.h>
#include <react/renderer/uimanager/UIManager.h>

namespace facebook::react {

using Status = SurfaceHandler::Status;

SurfaceHandler::SurfaceHandler(
    const std::string& moduleName,
    SurfaceId surfaceId) noexcept {
  parameters_.moduleName = moduleName;
  parameters_.surfaceId = surfaceId;
}

#pragma mark - Surface Life-Cycle Management

void SurfaceHandler::setContextContainer(
    std::shared_ptr<const ContextContainer> contextContainer) const noexcept {
  parameters_.contextContainer = std::move(contextContainer);
}

Status SurfaceHandler::getStatus() const noexcept {
  std::shared_lock lock(linkMutex_);
  return link_.status;
}

void SurfaceHandler::start() const noexcept {
  TraceSection s("SurfaceHandler::start");
  std::unique_lock lock(linkMutex_);
  react_native_assert(
      link_.status == Status::Registered && "Surface must be registered.");
  react_native_assert(
      getLayoutConstraints().layoutDirection != LayoutDirection::Undefined &&
      "layoutDirection must be set.");
  react_native_assert(
      parameters_.contextContainer && "ContextContainer must be set.");

  auto parameters = Parameters{};
  {
    TraceSection s2("SurfaceHandler::start::paramsLock");
    std::shared_lock parametersLock(parametersMutex_);
    parameters = parameters_;
  }

  auto shadowTree = std::make_unique<ShadowTree>(
      parameters.surfaceId,
      parameters.layoutConstraints,
      parameters.layoutContext,
      *link_.uiManager,
      *parameters.contextContainer);

  link_.shadowTree = shadowTree.get();

  if (!parameters.moduleName.empty()) {
    link_.uiManager->startSurface(
        std::move(shadowTree),
        parameters.moduleName,
        parameters.props,
        parameters_.displayMode);
  } else {
    link_.uiManager->startEmptySurface(std::move(shadowTree));
  }

  link_.status = Status::Running;

  applyDisplayMode(parameters.displayMode);
}

void SurfaceHandler::stop() const noexcept {
  auto shadowTree = ShadowTree::Unique{};
  {
    std::unique_lock lock(linkMutex_);
    react_native_assert(
        link_.status == Status::Running && "Surface must be running.");

    link_.status = Status::Registered;
    link_.shadowTree = nullptr;
    shadowTree = link_.uiManager->stopSurface(parameters_.surfaceId);
  }

  // As part of stopping a Surface, we need to properly destroy all
  // mounted views, so we need to commit an empty tree to trigger all
  // side-effects (including destroying and removing mounted views).
  react_native_assert(shadowTree && "`shadowTree` must not be null.");
  if (shadowTree) {
    shadowTree->commitEmptyTree();
  }
}

void SurfaceHandler::setDisplayMode(DisplayMode displayMode) const noexcept {
  auto parameters = Parameters{};
  {
    std::unique_lock lock(parametersMutex_);
    if (parameters_.displayMode == displayMode) {
      return;
    }

    parameters_.displayMode = displayMode;
    parameters = parameters_;
  }

  {
    std::shared_lock lock(linkMutex_);

    if (link_.status != Status::Running) {
      return;
    }

    link_.uiManager->setSurfaceProps(
        parameters.surfaceId,
        parameters.moduleName,
        parameters.props,
        parameters.displayMode);

    applyDisplayMode(displayMode);
  }
}

DisplayMode SurfaceHandler::getDisplayMode() const noexcept {
  std::shared_lock lock(parametersMutex_);
  return parameters_.displayMode;
}

#pragma mark - Accessors

SurfaceId SurfaceHandler::getSurfaceId() const noexcept {
  std::shared_lock lock(parametersMutex_);
  return parameters_.surfaceId;
}

void SurfaceHandler::setSurfaceId(SurfaceId surfaceId) const noexcept {
  std::unique_lock lock(parametersMutex_);
  parameters_.surfaceId = surfaceId;
}

std::string SurfaceHandler::getModuleName() const noexcept {
  std::shared_lock lock(parametersMutex_);
  return parameters_.moduleName;
}

void SurfaceHandler::setProps(const folly::dynamic& props) const noexcept {
  TraceSection s("SurfaceHandler::setProps");
  auto parameters = Parameters{};
  {
    std::unique_lock lock(parametersMutex_);

    parameters_.props = props;
    parameters = parameters_;
  }

  {
    std::shared_lock lock(linkMutex_);

    if (link_.status == Status::Running) {
      link_.uiManager->setSurfaceProps(
          parameters.surfaceId,
          parameters.moduleName,
          parameters.props,
          parameters.displayMode);
    }
  }
}

folly::dynamic SurfaceHandler::getProps() const noexcept {
  std::shared_lock lock(parametersMutex_);
  return parameters_.props;
}

std::shared_ptr<const MountingCoordinator>
SurfaceHandler::getMountingCoordinator() const noexcept {
  std::shared_lock lock(linkMutex_);
  react_native_assert(
      link_.status != Status::Unregistered && "Surface must be registered.");
  react_native_assert(
      link_.shadowTree && "`link_.shadowTree` must not be null.");
  return link_.shadowTree->getMountingCoordinator();
}

#pragma mark - Layout

Size SurfaceHandler::measure(
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const {
  std::shared_lock lock(linkMutex_);

  if (link_.status != Status::Running) {
    return layoutConstraints.clamp({.width = 0, .height = 0});
  }

  react_native_assert(
      link_.shadowTree && "`link_.shadowTree` must not be null.");

  auto currentRootShadowNode =
      link_.shadowTree->getCurrentRevision().rootShadowNode;

  PropsParserContext propsParserContext{
      parameters_.surfaceId, *parameters_.contextContainer};

  auto rootShadowNode = currentRootShadowNode->clone(
      propsParserContext, layoutConstraints, layoutContext);
  rootShadowNode->layoutIfNeeded();
  return rootShadowNode->getLayoutMetrics().frame.size;
}

void SurfaceHandler::constraintLayout(
    const LayoutConstraints& layoutConstraints,
    const LayoutContext& layoutContext) const {
  TraceSection s("SurfaceHandler::constraintLayout");
  {
    std::unique_lock lock(parametersMutex_);

    if (parameters_.layoutConstraints == layoutConstraints &&
        parameters_.layoutContext == layoutContext) {
      return;
    }

    parameters_.layoutConstraints = layoutConstraints;
    parameters_.layoutContext = layoutContext;
  }

  {
    std::shared_lock lock(linkMutex_);

    if (link_.status != Status::Running) {
      return;
    }

    PropsParserContext propsParserContext{
        parameters_.surfaceId, *parameters_.contextContainer};

    react_native_assert(
        link_.shadowTree && "`link_.shadowTree` must not be null.");
    link_.shadowTree->commit(
        [&](const RootShadowNode& oldRootShadowNode) {
          return oldRootShadowNode.clone(
              propsParserContext, layoutConstraints, layoutContext);
        },
        {/* default commit options */});
  }
}

LayoutConstraints SurfaceHandler::getLayoutConstraints() const noexcept {
  std::shared_lock lock(parametersMutex_);
  return parameters_.layoutConstraints;
}

LayoutContext SurfaceHandler::getLayoutContext() const noexcept {
  std::shared_lock lock(parametersMutex_);
  return parameters_.layoutContext;
}

#pragma mark - Private

void SurfaceHandler::applyDisplayMode(DisplayMode displayMode) const {
  TraceSection s("SurfaceHandler::applyDisplayMode");
  react_native_assert(
      link_.status == Status::Running && "Surface must be running.");
  react_native_assert(
      link_.shadowTree && "`link_.shadowTree` must not be null.");

  switch (displayMode) {
    case DisplayMode::Visible:
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Normal);
      break;
    case DisplayMode::Suspended:
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Suspended);
      break;
    case DisplayMode::Hidden:
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Normal);
      // Getting a current revision.
      auto revision = link_.shadowTree->getCurrentRevision();
      // Committing an empty tree to force mounting to disassemble view
      // hierarchy.
      link_.shadowTree->commitEmptyTree();
      link_.shadowTree->setCommitMode(ShadowTree::CommitMode::Suspended);
      // Committing the current revision back. It will be mounted only when
      // `DisplayMode` is changed back to `Normal`.
      link_.shadowTree->commit(
          [&](const RootShadowNode& /*oldRootShadowNode*/) {
            return std::static_pointer_cast<RootShadowNode>(
                revision.rootShadowNode->ShadowNode::clone({}));
          },
          {/* default commit options */});
      break;
  }
}

void SurfaceHandler::setUIManager(const UIManager* uiManager) const noexcept {
  std::unique_lock lock(linkMutex_);

  react_native_assert(
      link_.status != Status::Running && "Surface must not be running.");

  if (link_.uiManager == uiManager) {
    return;
  }

  link_.uiManager = uiManager;
  link_.status =
      uiManager != nullptr ? Status::Registered : Status::Unregistered;
}

SurfaceHandler::~SurfaceHandler() noexcept {
  react_native_assert(
      link_.status == Status::Unregistered &&
      "`SurfaceHandler` must be unregistered (or moved-from) before deallocation.");
}

} // namespace facebook::react
