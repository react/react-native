/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageState.h"

#include <cstdlib>
#include <limits>

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/image/ImageShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/imagemanager/ImageRequestParams.h>

namespace facebook::react {

const char ImageComponentName[] = "Image";

void ImageShadowNode::setImageManager(
    const std::shared_ptr<ImageManager>& imageManager) {
  ensureUnsealed();
  imageManager_ = imageManager;

  // TODO: T226624691 Improve image request creation to avoid double requests
  // The image manager is set when the component descriptor adopts the shadow
  // node. For instances where the shadow node was cloned without dirtying the
  // layout, if the image source was changed we have to initiate the image
  // request now since there is no guarantee that layout will run for the shadow
  // node at a later time.
  if (getIsLayoutClean() ||
      ReactNativeFeatureFlags::enableImagePrefetchingAndroid()) {
    auto sources = getConcreteProps().sources;
    auto layoutMetric = getLayoutMetrics();
    if (sources.size() <= 1 ||
        (layoutMetric.frame.size.width > 0 &&
         layoutMetric.frame.size.height > 0)) {
      updateStateIfNeeded();
    }
  }
}

void ImageShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  const auto& savedState = getStateData();
  const auto& oldImageSource = savedState.getImageSource();
  auto newImageSource = getImageSource();
  const auto& oldImageRequestParams = savedState.getImageRequestParams();
  const auto& imageProps = getConcreteProps();
  const auto& newImageRequestParams = ImageRequestParams(
      imageProps.blurRadius
#ifdef ANDROID
      ,
      imageProps.defaultSource,
      imageProps.resizeMode,
      imageProps.resizeMethod,
      // TODO: should we resizeMultiplier * imageSource.scale ?
      imageProps.resizeMultiplier,
      imageProps.shouldNotifyLoadEvents,
      imageProps.overlayColor,
      imageProps.tintColor,
      imageProps.fadeDuration,
      imageProps.progressiveRenderingEnabled,
      imageProps.loadingIndicatorSource,
      imageProps.internal_analyticTag,
      Size{
          .width =
              layoutMetrics_.frame.size.width * layoutMetrics_.pointScaleFactor,
          .height = layoutMetrics_.frame.size.height *
              layoutMetrics_.pointScaleFactor}
#endif
  );

  if (oldImageSource == newImageSource &&
      oldImageRequestParams == newImageRequestParams) {
    return;
  }

#ifdef ANDROID
  // Check if we should skip prefetching based on shouldResize logic
  if (ReactNativeFeatureFlags::enableImagePrefetchingAndroid()) {
    const auto& resizeMethod = imageProps.resizeMethod;
    const auto& uri = newImageSource.uri;
    bool shouldResize = (resizeMethod == "resize") ||
        // Only resize for local content/file URIs
        (resizeMethod == "auto" &&
         (uri.starts_with("content://") || uri.starts_with("file://")));
    // If we would resize but have no dimensions, skip creating the request
    if (shouldResize &&
        (newImageSource.size.width == 0 || newImageSource.size.height == 0 ||
         layoutMetrics_.frame.size.width == 0 ||
         layoutMetrics_.frame.size.height == 0)) {
      // Keep the old state - don't create a new image request
      return;
    }
  }
#endif

  ImageState state{
      newImageSource,
      imageManager_->requestImage(
          newImageSource, getSurfaceId(), newImageRequestParams, getTag()),
      newImageRequestParams};
  setStateData(std::move(state));
}

ImageSource ImageShadowNode::getImageSource() const {
  auto sources = getConcreteProps().sources;

  if (sources.empty()) {
    return {
        /* .type = */ ImageSource::Type::Invalid,
    };
  }

  auto layoutMetrics = getLayoutMetrics();
  auto size = layoutMetrics.getContentFrame().size;
  auto scale = layoutMetrics.pointScaleFactor;

  if (sources.size() == 1) {
    auto source = sources[0];
    source.size = size;
    source.scale = scale;
    return source;
  }

  auto targetImageArea = size.width * size.height * scale * scale;
  auto bestFit = std::numeric_limits<Float>::infinity();

  auto bestSource = ImageSource{};

  for (const auto& source : sources) {
    auto sourceSize = source.size;
    auto sourceScale = source.scale == 0 ? scale : source.scale;
    auto sourceArea =
        sourceSize.width * sourceSize.height * sourceScale * sourceScale;

    auto fit = std::abs(1 - (sourceArea / targetImageArea));

    if (fit < bestFit) {
      bestFit = fit;
      bestSource = source;
    }
  }

  bestSource.size = size;
  bestSource.scale = scale;

  return bestSource;
}

#pragma mark - LayoutableShadowNode

void ImageShadowNode::layout(LayoutContext layoutContext) {
  updateStateIfNeeded();
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace facebook::react
