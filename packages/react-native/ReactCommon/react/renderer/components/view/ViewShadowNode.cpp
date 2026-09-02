/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ViewShadowNode.h"
#include <react/renderer/components/view/HostPlatformViewTraitsInitializer.h>
#include <react/renderer/components/view/primitives.h>
#include <react/renderer/graphics/BackgroundImage.h>
#include <react/renderer/imagemanager/ImageManager.h>
#include <react/renderer/imagemanager/primitives.h>

namespace facebook::react {

// NOLINTNEXTLINE(facebook-hte-CArray,modernize-avoid-c-arrays)
const char ViewComponentName[] = "View";

ViewShadowNode::ViewShadowNode(
    const ShadowNodeFragment& fragment,
    const ShadowNodeFamily::Shared& family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  initialize();
}

ViewShadowNode::ViewShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  initialize();
}

void ViewShadowNode::initialize() noexcept {
  auto& viewProps = static_cast<const ViewProps&>(*props_);

  auto hasBorder = [&]() {
    for (auto edge : yoga::ordinals<yoga::Edge>()) {
      if (viewProps.yogaStyle.border(edge).isDefined()) {
        return true;
      }
    }
    return false;
  };

  bool formsStackingContext = !viewProps.collapsable ||
      viewProps.pointerEvents == PointerEventsMode::BoxOnly ||
      viewProps.pointerEvents == PointerEventsMode::None ||
      !viewProps.nativeId.empty() || viewProps.accessible ||
      viewProps.opacity != 1.0 || viewProps.transform != Transform{} ||
      (viewProps.zIndex.has_value() &&
       viewProps.yogaStyle.positionType() != yoga::PositionType::Static) ||
      viewProps.yogaStyle.display() == yoga::Display::None ||
      viewProps.getClipsContentToBounds() || viewProps.events.bits.any() ||
      isColorMeaningful(viewProps.shadowColor) ||
      viewProps.accessibilityElementsHidden ||
      viewProps.accessibilityViewIsModal ||
      viewProps.importantForAccessibility != ImportantForAccessibility::Auto ||
      viewProps.removeClippedSubviews || viewProps.cursor != Cursor::Auto ||
      !viewProps.filter.empty() ||
      viewProps.mixBlendMode != BlendMode::Normal ||
      viewProps.isolation == Isolation::Isolate ||
      !viewProps.maskImage.empty() ||
      HostPlatformViewTraitsInitializer::formsStackingContext(viewProps) ||
      !viewProps.accessibilityOrder.empty();

  bool formsView = formsStackingContext ||
      isColorMeaningful(viewProps.backgroundColor) || hasBorder() ||
      !viewProps.testId.empty() || !viewProps.boxShadow.empty() ||
      !viewProps.backgroundImage.empty() ||
      HostPlatformViewTraitsInitializer::formsView(viewProps) ||
      viewProps.outlineWidth > 0;

  if (formsView) {
    traits_.set(ShadowNodeTraits::Trait::FormsView);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::FormsView);
  }

  if (formsStackingContext) {
    traits_.set(ShadowNodeTraits::Trait::FormsStackingContext);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::FormsStackingContext);
  }

  if (!viewProps.collapsableChildren) {
    traits_.set(ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  } else {
    traits_.unset(ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  }
}

void ViewShadowNode::setImageManager(
    const std::shared_ptr<ImageManager>& imageManager) {
  ensureUnsealed();
  imageManager_ = imageManager;
  updateStateIfNeeded();
}

void ViewShadowNode::updateStateIfNeeded() {
  if (!imageManager_) {
    return;
  }

  ensureUnsealed();

  const auto& viewProps = static_cast<const ViewProps&>(*props_);

  std::vector<BackgroundImageURLRequest> newRequests;
  auto collectRequests = [&](const std::vector<BackgroundImage>& images) {
    for (const auto& image : images) {
      if (!std::holds_alternative<URLBackgroundImage>(image)) {
        continue;
      }
      const auto& urlImage = std::get<URLBackgroundImage>(image);
      if (urlImage.uri.empty()) {
        continue;
      }
      BackgroundImageURLRequest request;
      request.imageSource.uri = urlImage.uri;
      request.imageSource.type =
          urlImage.uri.find("__packager_asset") != std::string::npos
          ? ImageSource::Type::Local
          : ImageSource::Type::Remote;
      newRequests.push_back(std::move(request));
    }
  };

  // `background-image` and `mask-image` share the same image loading pipeline.
  collectRequests(viewProps.backgroundImage);
  collectRequests(viewProps.maskImage);

  if (newRequests.empty()) {
    return;
  }

  const auto& savedState = getStateData();
  const auto& oldRequests = savedState.getBackgroundImageRequests();

  bool requestsChanged = newRequests.size() != oldRequests.size();
  if (!requestsChanged) {
    for (size_t i = 0; i < newRequests.size(); ++i) {
      if (newRequests[i].imageSource != oldRequests[i].imageSource) {
        requestsChanged = true;
        break;
      }
    }
  }

  if (!requestsChanged) {
    return;
  }

  for (auto& request : newRequests) {
    request.imageRequest = std::make_shared<ImageRequest>(
        imageManager_->requestImage(request.imageSource, getSurfaceId()));
  }

  ViewState state{std::move(newRequests)};
  setStateData(std::move(state));
}

} // namespace facebook::react
