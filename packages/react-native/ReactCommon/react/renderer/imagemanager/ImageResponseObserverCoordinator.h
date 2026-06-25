/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/imagemanager/ImageResponse.h>
#include <react/renderer/imagemanager/ImageResponseObserver.h>
#include <react/utils/SharedFunction.h>

#include <memory>
#include <mutex>
#include <vector>

namespace facebook::react {

/*
 * The ImageResponseObserverCoordinator receives events and completed image
 * data from native image loaders and sends events to any observers attached
 * to the coordinator. The Coordinator also keeps track of response status
 * and caches completed images.
 */
class ImageResponseObserverCoordinator {
 public:
  ImageResponseObserverCoordinator(SharedFunction<> resumeFunction, SharedFunction<> cancelationFunction);

  /*
   * Interested parties may observe the image response.
   * If the current image request status is not equal to `Loading`, the observer
   * will be called immediately.
   */
  void addObserver(std::shared_ptr<const ImageResponseObserver> observer) const;

  /*
   * Interested parties may stop observing the image response.
   */
  void removeObserver(const std::shared_ptr<const ImageResponseObserver> &observer) const;

  /*
   * Platform-specific image loader will call this method with progress updates.
   */
  void nativeImageResponseProgress(float progress, int64_t loaded, int64_t total) const;

  /*
   * Platform-specific image loader will call this method with a completed image
   * response.
   */
  void nativeImageResponseComplete(const ImageResponse &imageResponse) const;

  /*
   * Platform-specific image loader will call this method in case of any
   * failures.
   */
  void nativeImageResponseFailed(const ImageLoadError &loadError) const;

 private:
  /*
   * Resets the cached image data pointers. Needs to be protected by mutex_.
   */
  void consumeResponse() const;

  /*
   * List of observers.
   * Mutable: protected by mutex_.
   */
  mutable std::vector<std::shared_ptr<const ImageResponseObserver>> observers_;

  /*
   * Current status of image loading.
   * Mutable: protected by mutex_.
   */
  mutable ImageResponse::Status status_{ImageResponse::Status::Loading};

  /*
   * Cache image data.
   * Mutable: protected by mutex_.
   */
  mutable std::shared_ptr<void> imageData_;

  /*
   * Cache image metadata.
   * Mutable: protected by mutex_.
   */
  mutable std::shared_ptr<void> imageMetadata_;

  /*
   * Cache image error Data.
   * Mutable: protected by mutex_.
   */
  mutable std::shared_ptr<void> imageErrorData_;

  /*
   * Observer and data mutex.
   */
  mutable std::mutex mutex_;

  /*
   * Function we can call to resume image request.
   */
  SharedFunction<> resumeRequest_;

  /*
   * Function we can call to cancel image request.
   */
  SharedFunction<> cancelRequest_;
};

} // namespace facebook::react
