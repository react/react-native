/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/imagemanager/ImageResponse.h>
#include <react/renderer/imagemanager/ImageResponseObserver.h>
#include <react/renderer/imagemanager/ImageResponseObserverCoordinator.h>
#include <react/renderer/imagemanager/ImageTelemetry.h>
#include <react/renderer/imagemanager/primitives.h>
#include <react/utils/SharedFunction.h>

namespace facebook::react {

/*
 * Represents ongoing request for an image resource.
 * The separate object must be constructed for every single separate
 * image request. The object cannot be copied because it would make managing of
 * event listeners hard and inefficient; the object can be moved though.
 * Destroy to cancel the underlying request.
 */
class ImageRequest final {
 public:
  /*
   * The default constructor
   */
  ImageRequest(
      ImageSource imageSource,
      std::shared_ptr<const ImageTelemetry> telemetry,
      SharedFunction<> resumeFunction = {},
      SharedFunction<> cancelationFunction = {});

  /*
   * The move constructor.
   */
  ImageRequest(ImageRequest&& other) noexcept = default;

  /*
   * Move assignment operator.
   */
  ImageRequest& operator=(ImageRequest&& other) noexcept = default;

  /*
   * `ImageRequest` does not support copying by design.
   */
  ImageRequest(const ImageRequest& other) = delete;
  ImageRequest& operator=(const ImageRequest& other) = delete;

  /*
   * Destructor
   */
  ~ImageRequest() = default;

  /*
   * Returns the Image Source associated with the request.
   */
  const ImageSource& getImageSource() const;

  /*
   * Returns stored observer coordinator as a shared pointer.
   * Retain this *or* `ImageRequest` to ensure a correct lifetime of the object.
   */
  const std::shared_ptr<const ImageResponseObserverCoordinator>&
  getSharedObserverCoordinator() const;

  /*
   * Returns stored observer coordinator as a reference.
   * Use this if a correct lifetime of the object is ensured in some other way
   * (e.g. by retaining an `ImageRequest`).
   */
  const ImageResponseObserverCoordinator& getObserverCoordinator() const;

  /*
   * Returns stored image telemetry object as a shared pointer.
   * Retain this *or* `ImageRequest` to ensure a correct lifetime of the object.
   */
  const std::shared_ptr<const ImageTelemetry>& getSharedTelemetry() const;

 private:
  /*
   * Image source associated with the request.
   */
  ImageSource imageSource_;

  /*
   * Image telemetry associated with the request.
   */
  std::shared_ptr<const ImageTelemetry> telemetry_{};

  /*
   * Event coordinator associated with the request.
   */
  std::shared_ptr<const ImageResponseObserverCoordinator> coordinator_{};
};

} // namespace facebook::react
