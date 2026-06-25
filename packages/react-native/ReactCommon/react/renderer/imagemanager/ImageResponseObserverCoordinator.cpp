/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ImageResponseObserverCoordinator.h"

#include <algorithm>

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

namespace facebook::react {

ImageResponseObserverCoordinator::ImageResponseObserverCoordinator(
    SharedFunction<> resumeFunction,
    SharedFunction<> cancelationFunction)
    : resumeRequest_(std::move(resumeFunction)),
      cancelRequest_(std::move(cancelationFunction)) {}

void ImageResponseObserverCoordinator::addObserver(
    std::shared_ptr<const ImageResponseObserver> observer) const {
  mutex_.lock();
  switch (status_) {
    case ImageResponse::Status::Loading: {
      observers_.push_back(observer);
      mutex_.unlock();
      break;
    }
    case ImageResponse::Status::Completed: {
      auto imageData = imageData_;
      auto imageMetadata = imageMetadata_;
      consumeResponse();
      mutex_.unlock();
      observer->didReceiveImage(ImageResponse{imageData, imageMetadata});
      break;
    }
    case ImageResponse::Status::Failed: {
      auto imageErrorData = imageErrorData_;
      mutex_.unlock();
      observer->didReceiveFailure(ImageLoadError{imageErrorData});
      break;
    }
    case ImageResponse::Status::Cancelled:
    case ImageResponse::Status::Consumed: {
      observers_.push_back(observer);
      status_ = ImageResponse::Status::Loading;
      mutex_.unlock();
      resumeRequest_();
      break;
    }
  }
}

void ImageResponseObserverCoordinator::removeObserver(
    const std::shared_ptr<const ImageResponseObserver>& observer) const {
  std::scoped_lock lock(mutex_);

  auto position = std::find(observers_.begin(), observers_.end(), observer);
  if (position != observers_.end()) {
    observers_.erase(position);

    if (observers_.empty() && status_ == ImageResponse::Status::Loading) {
      status_ = ImageResponse::Status::Cancelled;
      cancelRequest_();
    }
  }
}

void ImageResponseObserverCoordinator::nativeImageResponseProgress(
    float progress,
    int64_t loaded,
    int64_t total) const {
  mutex_.lock();
  auto observers = observers_;
  react_native_assert(
      status_ == ImageResponse::Status::Loading ||
      status_ == ImageResponse::Status::Cancelled);
  mutex_.unlock();

  for (const auto& observer : observers) {
    observer->didReceiveProgress(progress, loaded, total);
  }
}

void ImageResponseObserverCoordinator::nativeImageResponseComplete(
    const ImageResponse& imageResponse) const {
  mutex_.lock();
  imageData_ = imageResponse.getImage();
  imageMetadata_ = imageResponse.getMetadata();
  react_native_assert(
      status_ == ImageResponse::Status::Loading ||
      status_ == ImageResponse::Status::Cancelled);
  status_ = ImageResponse::Status::Completed;
  auto observers = observers_;
  if (!observers.empty()) {
    consumeResponse();
  }
  mutex_.unlock();

  for (const auto& observer : observers) {
    observer->didReceiveImage(imageResponse);
  }
}

void ImageResponseObserverCoordinator::nativeImageResponseFailed(
    const ImageLoadError& loadError) const {
  mutex_.lock();
  react_native_assert(
      status_ == ImageResponse::Status::Loading ||
      status_ == ImageResponse::Status::Cancelled);
  status_ = ImageResponse::Status::Failed;
  imageErrorData_ = loadError.getError();
  auto observers = observers_;
  mutex_.unlock();

  for (const auto& observer : observers) {
    observer->didReceiveFailure(loadError);
  }
}

void ImageResponseObserverCoordinator::consumeResponse() const {
  status_ = ImageResponse::Status::Consumed;
  imageData_.reset();
  imageMetadata_.reset();
}

} // namespace facebook::react
