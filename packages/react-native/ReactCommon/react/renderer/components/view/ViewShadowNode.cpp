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
  const auto& backgroundImages = viewProps.backgroundImage;

  std::vector<BackgroundImageURLRequest> newRequests;
  for (const auto& bgImage : backgroundImages) {
    if (std::holds_alternative<URLBackgroundImage>(bgImage)) {
      const auto& urlBgImage = std::get<URLBackgroundImage>(bgImage);
      if (!urlBgImage.uri.empty()) {
        BackgroundImageURLRequest request;
        request.imageSource.uri = urlBgImage.uri;
        // `resolveAssetSource` already turns bundled assets into a uri on the
        // JS side, so everything reaching here is addressed by url.
        request.imageSource.type = ImageSource::Type::Remote;
        // ImageSource::scale defaults to 3, which would make the decoded image
        // report a third of its real size. Bundled assets carry their natural
        // size in the props instead, so treat the decoded pixels as 1x here.
        request.imageSource.scale = 1;
        newRequests.push_back(std::move(request));
      }
    }
  }

  if (newRequests.empty()) {
    return;
  }

  // A view only gets state once it has a url() background image, so there may
  // be nothing to compare against yet.
  if (state_) {
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
  }

  for (auto& request : newRequests) {
    request.imageRequest = std::make_shared<ImageRequest>(
        imageManager_->requestImage(request.imageSource, getSurfaceId()));
  }

  ViewState state{std::move(newRequests)};
  if (state_) {
    setStateData(std::move(state));
  } else {
    state_ = std::make_shared<const ConcreteState>(
        std::make_shared<const ViewState>(std::move(state)), getFamilyShared());
  }
}

} // namespace facebook::react
